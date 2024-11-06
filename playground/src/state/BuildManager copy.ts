// import { Trigger, MagicFS, Volume, MagicFile, hashString, FileContents } from "@cmajor-playground/utilities";
// import { Builder } from "@cmajor-playground/builders";
// import { Project } from "./Project";
// export type BuildInfo = { ready: boolean, hash: string, path: string, id: string, type?: string };
// export class BuildManager {
// 	public onChange = new Trigger;
// 	private fs: MagicFS;
// 	private builders: Builder[] = [];
// 	private tasks: Record<string, Promise<any>> = {};
// 	public products: Record<string, BuildInfo> = {};
// 	constructor(public project: Project, public builds: Volume, builders: (new (fs: MagicFS) => Builder)[]) {
// 		this.fs = project.fs
// 		this.builders = builders.map(BuilderClass => new BuilderClass(this.fs));
// 		this.project.volume.watch(this.update);
// 		this.update();
// 	}
// 	private update = async () => {
// 		this.builders.forEach(builder => builder.invalidateCache());
// 		const intents = (await Promise.all(this.builders.map(async (builder) => (await builder.getPaths()).map(item => ({ ...item, builder }))))).flat();
// 		Object.keys(this.products).filter(path => !intents.find(intent => intent.mainPath == path)).forEach(path => delete this.products[path])
// 		this.onChange.trigger();
// 		await Promise.all(intents.map(intent => this.createTaskIfNeeded(intent.builder, intent.mainPath, intent.paths)));
// 		await Promise.all(Object.values(this.tasks));
// 	}
// 	private createTaskIfNeeded = async (builder: Builder, mainPath: string, paths: string[]) => {
// 		const allPaths = [mainPath, ...paths];
// 		const hashes: Record<string, string> = {};
// 		let id = '';
// 		for (let path of allPaths) {
// 			const file = await this.fs.get<MagicFile>(path);
// 			if (path == mainPath && file) id = file.id;
// 			if (file) hashes[file.path] = file.hash;
// 		}
// 		const hash = await hashString(builder.type, ...Object.entries(hashes).flat());
// 		this.products[mainPath] ??= { hash, ready: false, path: mainPath, id };
// 		if (this.products[mainPath].hash != hash) {
// 			this.products[mainPath].ready = false;
// 			this.products[mainPath].hash = hash;
// 			this.onChange.trigger();
// 		}
// 		return this.tasks[hash] ??= this.build(hash, builder, mainPath, paths, hashes).then(result => {
// 			delete this.tasks[hash];
// 			const product = this.products[mainPath];
// 			if (product?.hash == hash) {
// 				product.ready = true;
// 				product.type = result.type;
// 			}
// 			this.onChange.trigger();
// 			return result.data;
// 		});
// 	}
// 	private build = async (hash: string, builder: Builder, mainPath: string, paths: string[], hashes: Record<string, string>) => {
// 		if (await this.builds.exists(hash)) return JSON.parse(await this.builds.readText(hash));
// 		const files: Record<string, FileContents> = {};
// 		for (let path of [mainPath, ...paths]) {
// 			let content: FileContents | undefined;
// 			const file = await this.fs.get<MagicFile>(path);
// 			for (let b of this.builders) {
// 				if (builder == b || !b.canTransform(path, builder.type)) continue;
// 				content = await b.transform(path, (await this.createTaskIfNeeded(b, path, await b.getAdditionalPaths(path))), builder.type);
// 			}
// 			content ??= await file?.content;
// 			if (file?.hash != hashes[path]) return;
// 			if (content) files[path] = content;
// 		}
// 		if (await this.builds.exists(hash)) return JSON.parse(await this.builds.readText(hash));
// 		const result = { data: await builder.build(mainPath, files), type: builder.type };
// 		await this.builds.writeFile(hash, JSON.stringify(result));
// 		return result;
// 	}
// 	public dispose = () => this.project.volume.unwatch(this.update);
// }