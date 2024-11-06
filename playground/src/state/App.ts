import { generateUniqueId, MagicFS, VirtualFS, Volume } from "@cmajor-playground/utilities"
import { Project } from "./Project";
import { ProjectTemplate, ProjectSource, AppConfig, ProjectInfo, ProjectSourceInfo, SourceFile, LanguageDefinition } from "./Types";
import monaco from '@cmajor-playground/bunaco';
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
		this.builders = config.builders;
		config.languages.forEach(language => this.registerLanguage(language));
		const json = monaco.languages.getLanguages().find(lang => lang.extensions?.includes('.json'))
		json!.extensions!.push('.cmajorpatch');
		
	}
	static registerLanguage(lang: LanguageDefinition): void {
		monaco.languages.register(lang.language);
		if (lang.configutation) monaco.languages.setLanguageConfiguration(lang.language.id, lang.configutation);
		if (lang.themeData) monaco.editor.defineTheme("vs-dark", lang.themeData);
		if (lang.hoverProvider) monaco.languages.registerHoverProvider(lang.language.id, lang.hoverProvider);
		if (lang.tokensProvider) monaco.languages.setMonarchTokensProvider(lang.language.id, lang.tokensProvider);
		if (lang.completionItemProvider) monaco.languages.registerCompletionItemProvider(lang.language.id, lang.completionItemProvider);
		if (lang.documentFormattingEditProvider) monaco.languages.registerDocumentFormattingEditProvider(lang.language.id, lang.documentFormattingEditProvider);
	}
	static generateProjectName = async () => `Untitled ${++this.lastProjectNumber}`;
	static getProjectInfo = async (id: string | undefined) => (await this.listProjects()).find(p => p.id == id)
	static listProjects = async (): Promise<ProjectInfo[]> => (await this.vfs.getVolumes()).filter(volume => volume.meta.isProject).map(volume => {
		return { id: volume.id, name: volume.meta.name, source: volume.meta.source, modified: volume.meta.modified };
	});
	static openProject = async (id?: string) => {
		id ??= this.lastOpenedProject;
		const info = await this.getProjectInfo(id) ?? await this.createProject();
		if (!info) throw new Error('Failed to open project');
		const projectVolume = await this.vfs.getVolume(info.id);
		const artifacts = await this.vfs.createVolume([info.id, 'artifcats'].join(':'), {}, info.id);
		this.lastOpenedProject = info.id;
		const ret = new Project(info, projectVolume);
		return await ret.init();
	}
	static createProject = async (name?: string, files?: string | SourceFile[], source?: ProjectSourceInfo) => {
		name ??= await this.generateProjectName();
		files = !files || typeof files == 'string' ? await this.templates[files ?? 'default']?.(name) : files ?? [];
		const id = generateUniqueId();
		const projectVolume = await this.vfs.createVolume(id, { name, source, isProject: true });
		files.forEach(file => file.type == 'dir' ? projectVolume.mkdir(file.path) : projectVolume.writeFile(file.path, file.content!));
		return await this.getProjectInfo(id);
	}
	static importProject = async (identifier: string) => {
		const projects = await this.listProjects();
		const sourceEntry = Object.entries(this.sources).find(([_, source]) => source.test(identifier));
		if (!sourceEntry) throw new Error("Source not found");
		const [type, source] = sourceEntry;
		const current = projects.find(p => p.source?.type == type && p.source.identifier == identifier);
		if (current) return current;
		const { name, files, meta } = await source.import(identifier);
		return await this.createProject(name, files, { type, identifier, meta });
	}
	static async deleteProject(id: string) {
		await this.vfs.deleteVolume(id);
		const projects = (await this.listProjects()).filter(project => project.id != id);
		this.lastOpenedProject = this.lastOpenedProject == id ? projects[0]?.id ?? undefined : this.lastOpenedProject;
	}
}
