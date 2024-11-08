import JSZip from "jszip";
import { DB, Reader, Writer } from "./DB";
import { generateUniqueId } from "./generateUniqueId";
import { sanitizePath } from "./sanitizePath";
export type WatcherCallback = (details: WatcherEvent) => void;
export type FileOperationType = 'mkdir' | 'unlink' | 'rename';
export type FileOperation = { path: string, oldPath?: string, id: string, type: FileOperationType }
export type FileWriteOperation = { path: string, oldPath?: string, id: string, type: 'writeFile', hash: string }
export type VolumeOperationType = 'volumeRemoved' | 'volumeAdded' | 'versionChanged';
export type VolumeOperation = { type: VolumeOperationType, version?: number }
export type Operation = VolumeOperation | FileOperation | FileWriteOperation;
export type WatcherEvent = { volume: string, operations: Operation[]; timestamp: number };
export type FSEntry = { path: string; type: 'file' | 'dir'; id: string; created: number; modified: number; size?: number; hash?: string; };

const normalizeContent = (content: string | Uint8Array): Uint8Array => typeof content === 'string' ? new TextEncoder().encode(content) : content
const hashContents = async (content: Uint8Array) => Array.from(new Uint8Array((await crypto.subtle.digest('SHA-256', content)))).map(b => b.toString(16).padStart(2, '0')).join('')
export class VirtualFS {

	private db: DB;
	private watchers: Set<WatcherCallback> = new Set;
	watch = (callback: WatcherCallback) => this.watchers.add(callback);
	unwatch = (callback: WatcherCallback) => this.watchers.delete(callback);
	public volumes: Record<string, Volume> = {};
	public constructor(private dbName = 'VirtualFS') {
		this.db = new DB(dbName);
		this.db.requireStore('volumes', 'id', false);
		this.db.requireIndex('volumes', 'parentVolumeId', { keys: 'parentVolumeId', unique: false });
		this.db.requireIndex('volumes', 'name', { keys: 'name', unique: false });
		this.db.requireIndex('volumes', 'tags', { keys: 'tags', unique: false, multiEntry: true });
		this.db.requireStore('volumeMeta', 'id', false);
		this.db.requireStore('entries', 'id', false);
		this.db.requireIndex('entries', '[volume,path]', { keys: ['volume', 'path'], unique: true });
		this.db.requireIndex('entries', 'tags', { keys: 'tags', unique: false, multiEntry: true });
		this.db.requireIndex('entries', 'volume', { keys: 'volume', unique: false });
		this.db.requireIndex('entries', 'path', { keys: 'path', unique: false });
		this.db.requireIndex('entries', '[volume,parentPath]', { keys: ['volume', 'parentPath'], unique: false });
		this.db.requireIndex('entries', 'type', { keys: 'type', unique: false });
		this.db.requireIndex('entries', 'hash', { keys: 'hash', unique: false });
		this.db.requireStore('content', 'hash', false);
		globalThis.addEventListener('storage', (event: StorageEvent) => this.forwardWatcherEvents(event, `${dbName}/change`));
	}
	private forwardWatcherEvents(e: StorageEvent, key: string): any {
		if (e.key !== key || !e.newValue) return;
		const value = JSON.parse(e.newValue) as WatcherEvent;
		this.watchers.forEach(watcher => watcher(value));
		this.volumes[value.volume]?.notifyWatchers(value);
	}
	getVolumes = async (parentVolumeId: string = '') => await this.db.read(['volumes'], async accessors => accessors.volumes.find('parentVolumeId', parentVolumeId))
	getTaggedVolumes = async (...tags: (string | string[])[]) => {
		return await this.db.read(['volumes'], async accessors => (await accessors.volumes.find('tags', tags[0]) ?? []).filter(vol => !tags.find(tag => !vol.tags.includes(tag))));
	}
	getTaggedVolumesWithMeta = async (...tags: (string | string[])[]) => {
		return await this.db.read(['volumes', 'volumeMeta'], async accessors => {
			const ret = (await accessors.volumes.find('tags', tags[0]) ?? []).filter(vol => !tags.find(tag => !vol.tags.includes(tag)));
			return await Promise.all(ret.map(async volume => ({ volume, meta: (await accessors.volumeMeta.get(volume.id))?.meta })));
		});
	}
	createVolume = async (id: string, name: string, tags: string[], meta: Record<string, any>, parentVolumeId: string = '') => {
		if (parentVolumeId != '' && !await this.getVolume(parentVolumeId)) throw new Error('Parent volume not found')
		await this.db.write(['volumes', 'volumeMeta'], async accessors => {
			accessors.volumes.set({ id, parentVolumeId, tags, name });
			accessors.volumeMeta.set({ id, meta });
		});
		this.broadcast({ type: 'volumeAdded' }, id)
		return await this.getVolume(id);
	}
	private broadcast(operations: Operation | Operation[], volumeId: string) {
		operations = [operations].flat();
		if (operations.length == 0) return;
		const detail = { operations, timestamp: Date.now(), volume: volumeId };
		this.watchers.forEach(watcher => watcher(detail));
		localStorage?.setItem(`${this.dbName}/change`, JSON.stringify(detail))
	}

	getVolume = async (id: string) => {
		if (this.volumes[id]) return this.volumes[id];
		const volume = await this.db.read(['volumes'], async accessors => accessors.volumes.get(id));
		if (!volume) throw new Error('Volume not found: ' + id);
		return this.volumes[id] ??= new Volume(this, volume.id, this.db, this.dbName);
	};
	async deleteVolume(id: string) {
		const volume = await this.getVolume(id);
		await volume.delete();
		delete this.volumes[id];
		this.broadcast({ type: 'volumeRemoved' }, id);
	}
}

type Watcher = { callback: WatcherCallback; path?: string; }
class VolumeReader<T extends Reader = Reader> {
	constructor(protected volumeId: string, protected accessors: Record<string, T>) { }
	public getMeta = async () => (await this.accessors.volumeMeta.get(this.volumeId))?.meta;
	public exists = async (path: string) => (await this.accessors.entries.findOne('[volume,path]', [this.volumeId, (sanitizePath(path))])) != null;
	public getById = async (id: string) => await this.accessors.entries.get<FSEntry>(id);
	public getStats = (inputPath: string) => this.accessors.entries.findOne<FSEntry>('[volume,path]', [this.volumeId, sanitizePath(inputPath)]);
	public readText = (inputPath: string) => this.readFile<string>(inputPath, 'string');
	public readBinary = (inputPath: string) => this.readFile<Uint8Array>(inputPath, 'binary');
	public async readFile<T extends string | Uint8Array = Uint8Array>(inputPath: string, encoding: 'string' | 'binary'): Promise<T> {
		const stats = await this.getStats(inputPath);
		if (!stats || stats.type !== 'file') throw new Error('File not found: ' + inputPath);
		const content = (await this.accessors.content.get(stats.hash!)).content;
		return encoding == 'string' ? new TextDecoder().decode(content as Uint8Array) as T : content as T;
	}
	private getFilesInDir = async (parentPath: string, recursive: boolean, ret: FSEntry[] = []) => {
		const entries = await this.accessors.entries.find('[volume,parentPath]', [this.volumeId, parentPath]);
		ret.push(...entries);//.map(f => ({ path: f.path, type: f.type, id: f.id, created: f.created, modified: f.modified, size: f.size, hash: f.hash })));
		if (!recursive) return ret;
		const subdirs = entries.filter(f => f.type === 'dir');
		for (const subdir of subdirs) await this.getFilesInDir(subdir.path, recursive, ret);
		return ret;
	};
	public async readDir(path: string, recursive: boolean = true): Promise<FSEntry[]> {
		if ((path = sanitizePath(path)) != '' && (await this.getStats(path))?.type != 'dir') throw new Error('Not a directory');
		return await this.getFilesInDir(path, recursive);
	}

}
class VolumeWriter extends VolumeReader<Writer> {


	private removals: Record<string, Set<string>> = {};
	constructor(volumeId: string, accessors: Record<string, Writer>, private operations: Operation[]) { super(volumeId, accessors) }
	private getSize = (content: any) => content.length ?? content.size ?? content.byteLength ?? 0;
	private trackRemoval(hash: string, fileId: string) {
		this.removals[hash] ??= new Set;
		this.removals[hash].add(fileId);
	}
	async execute<T>(handler: (writer: VolumeWriter) => (Promise<T> | T)) {
		const ret = await handler(this);
		// console.log('executed', handler, this.operations);
		if (this.operations.find(op => op.type != 'versionChanged')) await this.incrementVersion();
		await this.checkRemovals();
		return ret;
	}
	private incrementVersion = async () => {
		const volume = await this.accessors.volumes.get(this.volumeId);
		if (!volume) return;
		volume.version = (volume.version ??= 0) + 1;
		this.accessors.volumes.set(volume);
		this.operations.push({ type: 'versionChanged', version: volume.version })
	}
	public resetVersion = async () => {
		const volume = await this.accessors.volumes.get(this.volumeId)
		volume.version = volume.version = 0;
		this.accessors.volumes.set(volume);
		this.operations.push({ type: 'versionChanged', version: 0 })
	}
	public mkdir = async (path: string, recursive: boolean = true): Promise<string | undefined> => {
		if ((path = sanitizePath(path)) == '') return;
		const parts = path.split('/');
		if (parts.length == 0) return;
		let ret: string | undefined = undefined;
		do {
			const path = parts.join('/');
			const current = await this.accessors.entries.findOne('[volume,path]', [this.volumeId, path]);
			if (current?.type === 'file') throw new Error(`Cannot create directory ${path}, file exists`);
			if (!current) {
				const id = generateUniqueId();
				ret ??= id;
				this.accessors.entries.set({ id: id, type: 'dir', volume: this.volumeId, path: path, parentPath: parts.slice(0, -1).join('/'), created: Date.now(), modified: Date.now() });
				this.operations.push({ path, type: 'mkdir', id });
			}
			parts.pop();
		} while (parts.length > 0 && recursive);
		return ret;
	}
	public async writeFile(path: string, content: Uint8Array, hash: string) {
		path = sanitizePath(path);
		const parentPath = path.split('/').slice(0, -1).join('/');
		await this.mkdir(parentPath, true);

		const currentFile = await this.accessors.entries.findOne('[volume,path]', [this.volumeId, path]);
		if (currentFile?.type == 'dir') throw new Error('Cannot write to a directory');
		const id = currentFile?.id ?? generateUniqueId();
		const created = currentFile?.created ?? Date.now();
		this.accessors.entries.set({ id, type: 'file', volume: this.volumeId, path, parentPath, size: this.getSize(content), created, modified: Date.now(), hash });
		if (currentFile?.hash != hash) {
			if (currentFile) this.trackRemoval(currentFile!.hash, currentFile.id);
			const currentContent = await this.accessors.content.get(hash);
			if (!currentContent) {
				this.accessors.content.set({ hash, content: content as Uint8Array });
			}
		}
		this.operations.push({ path, type: 'writeFile', id, hash });
		return id;
	}
	public rename = async (currentPath: string, newPath: string) => {
		const renameEntry = async (entry: FSEntry, newPath: string) => {
			if (!entry) throw new Error('File not found');
			const newParentPath = newPath.split('/').slice(0, -1).join('/');
			this.accessors.entries.set({ ...entry, path: newPath, parentPath: newParentPath, modified: Date.now() });
			this.operations.push({ path: entry.path, oldPath: currentPath, type: 'rename', id: entry.id });
			if (entry.type === 'dir') {
				const entries = await this.accessors.entries.find<FSEntry>('[volume,parentPath]', [this.volumeId, entry.path]);
				for (const subdir of entries) await renameEntry(subdir, sanitizePath(newPath + '/' + subdir.path.slice(entry.path.length)));
			}
		};
		const entry = await this.accessors.entries.findOne('[volume,path]', [this.volumeId, sanitizePath(currentPath)]);
		await renameEntry(entry, sanitizePath(newPath));
	}
	public unlink = async (path: string) => {
		const unlink = async (entry: FSEntry) => {
			if (!entry) throw new Error('File not found');
			if (entry.type === 'dir') {
				for (const subdir of await this.accessors.entries.find<FSEntry>('[volume,parentPath]', [this.volumeId, entry.path])) await unlink(subdir);
			} else this.trackRemoval(entry.hash!, entry.id);
			this.accessors.entries.delete(entry.id);
			this.operations.push({ path: entry.path, type: 'unlink', id: entry.id });
		};
		const entry = await this.accessors.entries.findOne('[volume,path]', [this.volumeId, sanitizePath(path)]);
		await unlink(entry);
	}
	public clear = async () => {
		const entries = await this.accessors.entries.find('volume', this.volumeId);
		const contents: Record<string, string[]> = {}
		entries.forEach(entry => {
			this.accessors.entries.delete(entry.id);
			contents[entry.hash] ??= [];
			contents[entry.hash].push(entry.id);
			this.trackRemoval(entry.hash, entry.id);
			this.operations.push({ path: entry.path, type: 'unlink', id: entry.id });
		});
	}
	public delete = async () => {
		await this.clear();
		this.accessors.volumes.delete(this.volumeId);
	}

	public setMeta = (meta: any) => this.accessors.volumeMeta.set({ id: this.volumeId, meta });
	async checkRemovals() {
		for (let hash in this.removals) {
			const exceptions = this.removals[hash];
			const entries = (await this.accessors.entries.find('hash', hash)).filter(f => !exceptions.has(f.id));
			if (entries.length == 0) {
				this.accessors.content.delete(hash);
			}
		}
	}

}
const allStores = ['entries', 'content', 'volumes', 'volumeMeta'];
export class Volume {
	private watchers: Set<Watcher> = new Set;

	constructor(public readonly vfs: VirtualFS, public readonly id: string, public readonly db: DB, private dbName: string) { }

	public watch = (callback: WatcherCallback, path?: string) => this.watchers.add({ callback, path });
	public unwatch = (callback: WatcherCallback) => this.watchers.delete([...this.watchers].find(w => w.callback == callback)!);
	public removeWatchers = () => this.watchers.clear();
	public notifyWatchers = (detail: WatcherEvent) => this.watchers.forEach(watcher => {
		detail = { ...detail, operations: watcher.path ? detail.operations.filter(op => (op as FileOperation).path?.startsWith(watcher.path ?? '')) : detail.operations };
		return detail.operations.length == 0 ? undefined : watcher.callback(detail);
	});

	public readTxn = <T>(handler: (reader: VolumeReader) => Promise<T>, stores?: string[]) => this.db.read(stores ?? allStores, accessors => handler(new VolumeReader(this.id, accessors)))
	public writeTxn = async<T>(handler: (writer: VolumeWriter) => (Promise<T> | T), stores?: string[]) => {
		const operations: Operation[] = [];
		const result = await this.db.write(stores ?? allStores, accessors => new VolumeWriter(this.id, accessors, operations).execute(handler));
		this.broadcast(operations);
		return result;
	}

	public getMeta = () => this.readTxn(reader => reader.getMeta());
	public setMeta = (meta: any) => this.writeTxn(writer => writer.setMeta(meta));
	public readText = (path: string) => this.readTxn(reader => reader.readText(path));
	public readBinary = (path: string) => this.readTxn(reader => reader.readBinary(path));
	public readFile = <T extends string | Uint8Array>(path: string, encoding: 'string' | 'binary') => this.readTxn<T>(reader => reader.readFile(path, encoding))
	public getStats = (inputPath: string) => this.readTxn(reader => reader.getStats(inputPath))
	public getById = (id: string) => this.readTxn(reader => reader.getById(id));
	public readDir = (inputPath: string, recursive: boolean = true) => this.readTxn(reader => reader.readDir(inputPath, recursive));
	public exists = (path: string) => this.readTxn(reader => reader.exists(path));
	public mkdir = (path: string, recursive: boolean = true) => this.writeTxn(writer => writer.mkdir(path, recursive))
	public prepFiles = (files: { path: string, content?: string | Uint8Array, type: 'dir' | 'file' }[]) => {
		return Promise.all(files.map(file => ({ path: file.path, type: file.type, content: file.content ? normalizeContent(file.content) : undefined })).map(async file => {
			return { path: file.path, content: file.content, type: file.type, hash: file.content ? await hashContents(file.content) : undefined }
		}))
	}
	public writeFile = async (path: string, content: string | Uint8Array) => {
		const hash = await hashContents(content = normalizeContent(content));
		return this.writeTxn(writer => writer.writeFile(path, content, hash));
	};
	public rename = (currentPath: string, newPath: string) => this.writeTxn(writer => writer.rename(currentPath, newPath));
	public unlink = (path: string) => this.writeTxn(writer => writer.unlink(path));
	public clear = () => this.writeTxn(writer => writer.clear());
	public delete = () => this.writeTxn(writer => writer.delete());
	public resetVersion = () => this.writeTxn(writer => writer.resetVersion(), ['volumes']);

	private broadcast(operations: Operation[]) {
		if (operations.length == 0) return;
		const detail = { operations, timestamp: Date.now(), volume: this.id };
		this.notifyWatchers(detail);
		localStorage?.setItem(`${this.dbName}/change`, JSON.stringify(detail))
	}
	async zipFolder(path: string, zip?: JSZip, prefixPath: string = '') {
		path = sanitizePath(path);
		if (path != '') path += '/';
		prefixPath = sanitizePath(prefixPath);
		zip ??= new JSZip();
		await this.db.read(['entries', 'content'], async accessors => {
			const entries = (await accessors.entries.find('volume', this.id)).filter(f => f.path.startsWith(path));
			for (const entry of entries) {
				const destPath = sanitizePath(prefixPath + '/' + entry.path.slice(path.length));
				entry.type == 'file' ? zip.file(destPath, (await accessors.content.get(entry.hash)).content) : zip.folder(destPath);
			}
		});
		return zip;
	}
}