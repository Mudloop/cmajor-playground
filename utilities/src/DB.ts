export type IndexDefinition = { keys: string | string[]; unique?: boolean; multiEntry?: boolean }
export type StoreDefinition = { keyPath?: string | string[], autoIncrement?: boolean }
export class DB {
	idb?: Promise<IDBDatabase>;
	constructor(private dbName: string) { }
	private storeRequirements: Record<string, StoreDefinition> = {};
	private indexRequirements: Record<string, Record<string, IndexDefinition>> = {};
	public requireStore = (name: string, keyPath?: string | string[], autoIncrement?: boolean) => this.storeRequirements[name] ??= { keyPath, autoIncrement };
	public requireIndex = (storeName: string, name: string, def: IndexDefinition) => (this.indexRequirements[storeName] ??= {})[name] ??= def;
	private async getDB(update?: boolean): Promise<IDBDatabase> {
		const db = await (this.idb ??= this.createDB(update));
		if (this.needsUpdate(db)) {
			db.close();
			delete this.idb;
			return await this.getDB(true);
		}
		return db;
	}
	private createDB(update: boolean | undefined): Promise<IDBDatabase> {
		return new Promise<IDBDatabase>(async (resolve, reject) => {
			const databases = await indexedDB.databases();
			const current = databases.find(db => db.name == this.dbName);
			const currentVersion = current?.version ?? 1;
			const newVersion = update ? currentVersion + 1 : currentVersion;
			const request = indexedDB.open(this.dbName, newVersion);
			request.onupgradeneeded = (event) => {
				const target = event.target as IDBOpenDBRequest;
				const db = target.result;
				for (let [name, def] of Object.entries(this.storeRequirements)) {
					if (db.objectStoreNames.contains(name)) continue;
					db.createObjectStore(name, { keyPath: def.keyPath, autoIncrement: def.autoIncrement });
				}
				for (let [storeName, indexes] of Object.entries(this.indexRequirements)) {
					const store = target.transaction!.objectStore(storeName);
					if (!store) continue;
					for (let [name, { keys, unique, multiEntry }] of Object.entries(indexes)) {
						if (store.indexNames.contains(name)) {
							const current = store.index(name);
							if ((current.unique ?? false) == (unique ?? false)
								&& (current.multiEntry ?? false) == (multiEntry ?? false)
								&& JSON.stringify(current.keyPath) == JSON.stringify(keys)) continue;
							store.deleteIndex(name);
						}
						store.createIndex(name, keys, { unique, multiEntry });
					}
				}
				this.storeRequirements = {};
				this.indexRequirements = {};
			};
			request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
			request.onerror = (event) => reject(`Failed to open database: ${(event.target as IDBOpenDBRequest).error}`);
		});
	}

	needsUpdate(db: IDBDatabase) {
		if (Object.keys(this.storeRequirements).find(name => !db.objectStoreNames.contains(name))) return true;
		if (Object.entries(this.indexRequirements).length == 0) return false;
		const txn = db.transaction(Object.keys(this.indexRequirements), 'readonly');
		for (let [storeName, indexes] of Object.entries(this.indexRequirements)) {
			const store = txn.objectStore(storeName);
			if (!store) continue;
			for (let [name, { keys, unique, multiEntry }] of Object.entries(indexes)) {
				if (!store.indexNames.contains(name)) return true;
				const current = store.index(name);
				if ((current.unique ?? false) != (unique ?? false)) return true;
				if ((current.multiEntry ?? false) != (multiEntry ?? false)) return true;
				if (JSON.stringify(current.keyPath) !== JSON.stringify(keys)) return true;
			}
		}
		return false;
	}
	async write<T extends string[]>(stores: T, handler: (accessors: { [K in T[number]]: Writer }) => any | Promise<any>) {
		const db = await this.getDB();
		const txn = db.transaction(stores, 'readwrite');
		const requestQueue: IDBRequest[] = [];
		let result: any;
		try {
			result = await handler(Object.fromEntries(stores.map(name => [name, new Writer(txn.objectStore(name), requestQueue)])) as any);
			if (result === false) {
				txn.abort();
				return;
			}
		} catch (e) {
			txn.abort();
			throw e;
		}
		const promises = requestQueue.map(r => new Promise((resolve, reject) => {
			if (r.readyState == 'done') {
				if (r.error) {
					reject(r.error);
					return;
				}
				resolve(r.result);
				return;
			}
			r.onsuccess = () => resolve(r.result);
			r.onerror = (e) => reject(e);
		}));
		await Promise.all(promises);
		return result;
	}
	async read<T extends string[], ReturnType = void>(stores: T, handler: (accessors: { [K in T[number]]: Reader }) => ReturnType | Promise<ReturnType>) {
		const db = await this.getDB();
		const txn = db.transaction(stores, 'readwrite');
		return await handler(Object.fromEntries(stores.map(name => [name, new Reader(txn.objectStore(name))])) as any);
	}
}
export class Reader {
	constructor(protected store: IDBObjectStore) { }
	get = <T = any>(key: IDBValidKey | IDBKeyRange) => new Promise<T | undefined>((resolve, reject) => {
		const request = this.store.get(key);
		request.onsuccess = () => resolve(request.result);
		request.onerror = (e) => reject(e);
	});
	all = <T = any>() => new Promise<T[]>((resolve, reject) => {
		const request = this.store.getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = (e) => reject(e);
	});
	find = <T = any>(index: string, value: IDBValidKey | IDBKeyRange) => new Promise<T[]>((resolve, reject) => {
		const request = this.store.index(index).getAll(value);
		request.onsuccess = () => resolve(request.result);
		request.onerror = (e) => reject(e);
	});
	findOne = <T = any>(index: string, value: IDBValidKey | IDBKeyRange) => new Promise<T>((resolve, reject) => {
		const request = this.store.index(index).get(value);
		request.onsuccess = () => resolve(request.result);
		request.onerror = (e) => reject(e);
	});
	cursor = <T = any>(index: string, range?: IDBKeyRange | IDBValidKey, direction?: IDBCursorDirection) => new Promise<T[]>((resolve, reject) => {
		const request = this.store.index(index).openCursor(range, direction);
		const results: T[] = [];
		request.onsuccess = () => {
			const cursor = request.result;
			if (!cursor) return resolve(results);
			results.push(cursor.value);
			cursor.continue();
		}
		request.onerror = (e) => reject(e);
	});
}
export class Writer extends Reader {
	constructor(store: IDBObjectStore, private requestQueue: IDBRequest[]) { super(store); }
	set = (value: any) => {
		const request = this.store.put(value);
		this.requestQueue.push(request);
	}
	delete = (key: IDBValidKey | IDBKeyRange) => {
		const request = this.store.delete(key);
		this.requestQueue.push(request);
	}
	clear = () => {
		const request = this.store.clear();
		this.requestQueue.push(request);
	}

}