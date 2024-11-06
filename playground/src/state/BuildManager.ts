import { Trigger, MagicFS, MagicFile, generateUniqueId } from "@cmajor-playground/utilities";
import { Builder, BuildInfo } from "@cmajor-playground/builders";
import { Project } from "./Project";

export class BuildManager {
	public onChange = new Trigger;
	private fs: MagicFS;
	private builders: Builder[] = [];
	public builds: Record<string, BuildInfo> = {};
	constructor(public project: Project, builders: Builder[]) {
		this.fs = project.fs
		this.builders = [...builders]
		this.project.volume.watch(this.update);
		this.update();
	}
	private update = async () => {
		const files = await this.fs.findAll<MagicFile>(entry => entry.isFile);
		files.map(file => {
			if (!file.isFile) return;
			const builder = this.builders.find(builder => builder.test(file.path));
			if (!builder) return;

			if (!this.builds[file.path]) this.builds[file.path] = { ready: false, hash: generateUniqueId(), path: file.path, id: file.id, type: builder.type, builder };
			else this.builds[file.path].ready = this.builds[file.path].build != undefined;
			builder.update(this.fs, file as MagicFile, (dirty: boolean) => {
				this.builds[file.path].ready = !dirty;
				this.onChange.trigger();
			}).then(result => {
				this.builds[file.path].ready = result != undefined;
				this.builds[file.path].build = result.build;
				this.builds[file.path].hash = result.hash;
				this.onChange.trigger();
			});
			return file.path;
		}).filter(path => path !== undefined);
		this.onChange.trigger();
	}

	public dispose = () => this.project.volume.unwatch(this.update);
}
(window as any).BuildManager = BuildManager;