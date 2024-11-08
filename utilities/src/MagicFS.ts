import naturalSort from "natural-sort";
import { Trigger, } from "./Trigger";
import { Volume, WatcherEvent } from "./VirtualFS";
import { mtype } from "./mtype";
import { isBinary } from "./isBinary";
import { sanitizePath } from "./sanitizePath";
export type FileContents = Uint8Array | string;
export abstract class MagicFSEntry {
	public disposed = false;
	public onChange = new Trigger;
	public onDelete = new Trigger;
	public get name() { return this.path.split('/').at(-1) ?? ''; }
	constructor(protected fs: MagicFS, public path: string, public id: string) { }
	dispose() {
		this.disposed = true;
		this.onDispose();
		this.onDelete.trigger();
		this.onDelete.dispose();
		this.onChange.dispose();
		return this.id;
	}
	reset() {
		this.onReset();
		this.onChange.trigger();
	}
	rename = (path: string) => this.disposed ? undefined : this.fs.rename(this, path);
	moveTo = (path: string) => this.disposed ? undefined : this.fs.rename(this, path + '/' + this.name);
	unlink = () => this.disposed ? undefined : this.fs.unlink(this);

	abstract isFile: boolean;
	abstract isDir: boolean;
	protected abstract onReset(): void;
	protected abstract onDispose(): void;
	get parent(): Promise<MagicDir | undefined> { return this.fs.get(sanitizePath(this.path + '/..')); }
}
export class MagicDir extends MagicFSEntry {
	isFile: false = false;
	isDir: true = true;
	private _children?: Promise<MagicFSEntry[]> | MagicFSEntry[];
	get children(): Promise<MagicFSEntry[]> | MagicFSEntry[] {
		return this.disposed ? Promise.resolve([]) : this._children ??= this.fs.getChildren(this).then(r => this._children = r);
	}
	onReset = () => this.disposed ? undefined : delete this._children;
	onDispose = () => this.disposed ? undefined : delete this._children;
	addFile = async (name: string, content: FileContents) => {
		if (this.disposed) return;
		if (await this.get(name)) throw new Error("File exists");
		return this.fs.getById((await this.fs.writeFile(this.path + '/' + name, content)));
	};
	mkdir = async (name: string) => this.disposed ? undefined : this.fs.getById(await this.fs.mkdir(this.path + '/' + name));
	get = async <T extends MagicFSEntry>(path: string) => {
		if (this.disposed) return;
		if (path == '') return this as any as T;
		let children = await this.children;
		const parts = path.split('/');
		for (let i = 0; i < parts.length - 1; i++) {
			const dir = children.find(f => f.name == parts[i] && f instanceof MagicDir);
			if (!dir?.isDir) return;
			children = await (dir as MagicDir).children;
		}
		return children.find(f => f.name == parts[parts.length - 1]) as T;
	}
}
export class MagicFile extends MagicFSEntry {
	isFile: true = true;
	isDir: false = false;
	constructor(fs: MagicFS, path: string, id: string, public hash: string) { super(fs, path, id); }
	private _content?: Promise<FileContents>;
	private _text?: Promise<string>;
	get content(): Promise<FileContents> {
		return this.disposed ? Promise.resolve(new Uint8Array(0)) : this._content ??= this.fs.getContent(this);
	}
	onReset = () => {
		delete this._content;
		delete this._text;
	};
	onDispose = () => this.disposed ? undefined : delete this._content;
	write = (content: FileContents) => this.disposed ? undefined : this.fs.writeFile(this.path, content);
}

export class MagicFS {
	root: MagicDir;
	private _lookup = new Map<String, MagicFSEntry>;
	constructor(private _volume: Volume) {
		this.root = new MagicDir(this, '', '');
		this._lookup.set('', this.root);
		_volume.watch(this._updateFiles);
	}
	get volumeId() { return this._volume.id; }
	private _updateFiles = (detail: WatcherEvent) => {
		for (let op of detail.operations) {
			if (op.type == 'volumeRemoved' || op.type == 'volumeAdded') continue;
			const parentPath = sanitizePath((op as any).path + '/..');
			this._findByPath(parentPath)?.reset();
			switch (op.type) {
				case 'rename': {
					const entry = this._findByPath(sanitizePath(op.oldPath!)!);
					if (entry) {
						entry.path = sanitizePath(op.path);
						entry.reset();
						(this._findByPath(sanitizePath(op.oldPath! + '/..')!))?.reset();
					}
					break;
				}
				case 'unlink': this._lookup.delete(this._lookup.get(op.id)?.dispose() ?? op.id); break;
				case 'writeFile':
					const file = this._lookup.get(op.id) as MagicFile;
					if (file) {
						file.hash = op.hash;
						file.reset();
					}
					break;
			}
		}
	}

	private _findByPath = <T extends MagicFSEntry>(path: string) => [...this._lookup.values()].find(entry => entry.path == path) as T;
	get = async <T extends MagicFSEntry>(path: string) => this.root.get<T>(sanitizePath(path));
	rename = async (entry: MagicFSEntry, path: string) => {
		await this._volume.rename(entry.path, path);
		entry.reset();
		(await entry.parent)!.reset();
	};
	unlink = async (entry: MagicFSEntry) => await this._volume.unlink(entry.path);
	mkdir = async (path: string) => await this._volume.mkdir(path);
	writeFile = async (path: string, content: FileContents) => await this._volume.writeFile(path, content);
	getChildren = async (parent: MagicDir): Promise<(MagicFSEntry)[]> => {
		try {
			return (await this._volume.readDir(parent.path, false)).map(file => {
				if (this._lookup.has(file.id)) {
					const entry = this._lookup.get(file.id)!;
					if (entry.isFile !== (file.type === 'file') || entry.isDir !== (file.type === 'dir')) {
						entry.dispose();
						this._lookup.delete(file.id);
					} else {
						entry.path = file.path;
						return entry;
					}
				}
				const entry = file.type == 'dir' ? new MagicDir(this, file.path, file.id) : new MagicFile(this, file.path, file.id, file.hash!);
				this._lookup.set(file.id, entry);
				return entry;
			}).sort((a, b) => a.isDir && b.isFile ? -1 : (a.isFile && b.isDir ? 1 : naturalSort()(a.name, b.name)));
		} catch (e) {
			console.error(e);

			return [];
		}
	}
	getContent = async (file: MagicFile) => {
		const mime = mtype(file.path);
		const binary = isBinary(mime);
		return await (binary ? this._volume.readBinary(file.path) : this._volume.readText(file.path));
	}
	find = async (predicate: (f: any) => any) => {
		const queue: MagicFSEntry[] = [this.root];
		while (queue.length) {
			const current = queue.shift()!;
			if (await predicate(current)) return current;
			if (current instanceof MagicDir) queue.push(...await current.children);
		}
	}
	findAll = async <T = MagicFSEntry>(predicate: (f: MagicFSEntry) => any) => {
		const ret: MagicFSEntry[] = [];
		const queue: MagicFSEntry[] = [this.root];
		while (queue.length) {
			const current = queue.shift()!;
			if (await predicate(current)) ret.push(current);
			if (current instanceof MagicDir) queue.push(...await current.children);
		}
		return ret as T[];
	}
	getById = async (id?: string) => {
		if (!id) return;
		if (this._lookup.has(id)) return this._lookup.get(id);
		const file = await this._volume.getById(id);
		if (!file) return;
		if (this._lookup.has(id)) return this._lookup.get(id);
		const entry = file.type == 'dir' ? new MagicDir(this, file.path, file.id) : new MagicFile(this, file.path, file.id, file.hash!);
		this._lookup.set(file.id, entry);
		return entry;
	}
	close = () => {
		this._volume.removeWatchers();
	}
}