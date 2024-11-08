import { generateUniqueId, sanitizePath, VirtualFS } from "@cmajor-playground/utilities"
import { Project } from "./Project";
import { ProjectTemplate, ProjectSource, AppConfig, ProjectInfo, ProjectSourceInfo, SourceFile } from "./Types";
import { Builder } from "@cmajor-playground/builders";
export class App {
	public static vfs: VirtualFS;
	public static builders: Builder[];
	private static templates: Record<string, ProjectTemplate>;
	private static sources: Record<string, ProjectSource>;
	static get lastOpenedProject() { return localStorage.getItem('lastOpenedProject') ?? undefined }
	static set lastOpenedProject(id: string | undefined) { id ? localStorage.setItem('lastOpenedProject', id) : localStorage.removeItem('lastOpenedProject'); }
	static get lastProjectNumber() { return parseInt(localStorage.getItem('lastProjectNumber') ?? '0') }
	static set lastProjectNumber(id: number) { localStorage.setItem('lastProjectNumber', id.toString()) }
	static init = async (config: AppConfig) => {
		try {
			await navigator?.serviceWorker?.register(config.serviceWorker.href);
		} catch (e) { console.error(e) }
		this.templates = config.templates ?? {};
		this.sources = config.sources ?? {};
		this.vfs = new VirtualFS(config.vfs);
		(window as any).vfs = this.vfs;
		this.builders = config.builders;

	}
	static generateProjectName = async () => `Untitled ${++this.lastProjectNumber}`;
	static getProjectInfo = async (id: string | undefined) => (await this.listProjects()).find(p => p.id == id)
	static listProjects = async (): Promise<ProjectInfo[]> => (await this.vfs.getTaggedVolumesWithMeta('project')).map(({ volume, meta }) => {
		return { id: volume.id, name: volume.name, source: meta.source, version: volume.version };
	});
	static openProject = async (id?: string, remember: boolean = true) => {
		id ??= this.lastOpenedProject;
		const info = await this.getProjectInfo(id) ?? await this.createProject();
		if (!info) throw new Error('Failed to open project');
		const projectVolume = await this.vfs.getVolume(info.id);
		if (remember || !this.lastOpenedProject) {
			this.lastOpenedProject = info.id;
		}
		const ret = new Project(info, projectVolume);
		return await ret.init();
	}
	static createProject = async (name?: string, files?: string | SourceFile[], source?: ProjectSourceInfo) => {
		name ??= await this.generateProjectName();
		files = !files || typeof files == 'string' ? await this.templates[files ?? 'default']?.(name) : files ?? [];
		const id = generateUniqueId();
		const tags = source ? ['project', source.type, source.identifier] : ['project'];
		const volume = await this.vfs.createVolume(id, name, tags, { source });
		const prepped = await volume.prepFiles(files);
		await volume.writeTxn(async writer => {
			for (let file of prepped) {
				if (file.type == 'dir') await writer.mkdir(file.path);
				else await writer.writeFile(file.path, file.content!, file.hash!);
			}
		})
		await volume.resetVersion();

		return await this.getProjectInfo(id);
	}
	static resetProject = async (id: string) => {
		const volume = await this.vfs.getVolume(id);
		const volumeMeta = await volume.getMeta();
		const identifier = volumeMeta?.source?.identifier;
		if (!identifier) return;
		const sourceEntry = Object.entries(this.sources).find(([_, source]) => source.test(identifier));
		if (!sourceEntry) throw new Error("Source not found");
		const [type, source] = sourceEntry;
		const { name, files, meta } = await source.import(identifier);
		const prepped = await volume.prepFiles(files);
		await volume.writeTxn(async writer => {
			for (let file of prepped) {
				if (file.type == 'dir') await writer.mkdir(file.path);
				else await writer.writeFile(file.path, file.content!, file.hash!);
			}
			const entries = await writer.readDir('');
			const removals = entries.filter(entry => !files.find(file => sanitizePath(file.path) == entry.path));
			removals.forEach(entry => writer.unlink(entry.path));
		})
		await volume.resetVersion();
	}
	static importProject = async (identifier: string) => {
		const sourceEntry = Object.entries(this.sources).find(([_, source]) => source.test(identifier));
		if (!sourceEntry) throw new Error("Source not found");
		const [type, source] = sourceEntry;
		const current = await this.vfs.getTaggedVolumes('project', type, identifier);
		if (current?.length) return current[0];
		const { name, files, meta } = await source.import(identifier);
		return await this.createProject(name, files, { type, identifier, meta });
	}
	static async deleteProject(id: string) {
		await this.vfs.deleteVolume(id);
		const projects = (await this.listProjects()).filter(project => project.id != id);
		this.lastOpenedProject = this.lastOpenedProject == id ? projects[0]?.id ?? undefined : this.lastOpenedProject;
	}
}
(window as any).App = App;