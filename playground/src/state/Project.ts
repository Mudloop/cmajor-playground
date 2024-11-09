import { ProjectInfo, Manifest } from "./Types";
import { MagicFile, MagicFS, sanitizePath, Trigger, Volume } from "@cmajor-playground/utilities";
import { App } from "./App";
import { Modals } from "../components/Modals";
import { BuildManager } from "./BuildManager";
import { EditorFile } from "./EditorFile";

export class Project {

	openFiles: EditorFile[] = [];
	openFilesOrder: EditorFile[] = [];
	onChange = new Trigger;
	onFilesChange = new Trigger;
	fs: MagicFS;
	buildManager: BuildManager;
	get focusedFile() { return this.openFilesOrder.at(-1) }
	get modified() { return this.info.version > 0; }
	constructor(public info: ProjectInfo, public volume: Volume) {
		this.fs = new MagicFS(volume);
		volume.watch(async (details) => {
			for (let detail of details.operations) {
				if (detail.type == 'volumeRemoved') document.location = document.location;
				if (detail.type == 'versionChanged') this.info.version = detail.version!;
				if (detail.type == 'unlink') this.closeFile(detail.id);
			}
			this.onFilesChange.trigger();
			this.onChange.trigger();
		});
		this.buildManager = new BuildManager(this, App.builders);
	}
	async init() {
		const serializedState = localStorage.getItem(`project-state-${this.info.id}`);
		const state = serializedState ? JSON.parse(serializedState) : undefined;
		if (!state) {
			const defaultFile = await this.getDefaultFile();
			if (defaultFile) await this.openFile(defaultFile);
			return this;
		}
		const openFiles: string[] = state.openFiles ?? [];
		const openFilesOrder: string[] = state.openFilesOrder ?? [];
		for (let id of openFiles) await this.openFile(id);
		for (let id of openFilesOrder) await this.openFile(id);
		this.updateEditorVisibility();
		return this;
	}
	focusEditor(editor: EditorFile) {
		this.openFilesOrder = this.openFilesOrder.filter(e => e != editor);
		this.openFilesOrder.push(editor);
		this.updateEditorVisibility();
		this.storeState();
		this.onChange.trigger();
	}
	private updateEditorVisibility() {
		for (let editor of this.openFiles) {
			// editor.style.display = editor == this.openFilesOrder.at(-1) ? '' : 'none';
		}
	}

	storeState() {
		const state = {
			openFiles: this.openFiles.map(editor => editor.file.id),
			openFilesOrder: this.openFilesOrder.map(editor => editor.file.id),
		};
		localStorage.setItem(`project-state-${this.info.id}`, JSON.stringify(state))
	}
	async getDefaultFile() {
		const cmajorpatch = await this.fs.find(f => f.path.endsWith('.cmajorpatch'));
		if (!cmajorpatch) return false;
		const content = await this.volume.readText(cmajorpatch.path);
		const manifest: Manifest = JSON.parse(content);
		const sources = [manifest.source].flat();
		if (sources.length > 0) {
			let path = sources[0];
			if (path?.startsWith('./')) path = path.substring(2);
			return (await this.fs.get(path!))?.id;
		}
		return cmajorpatch.id;
	}
	// private createEditor = (file: MagicFile) => {
	// 	const ret = isBinary(mtype(file.path)) ? new FileViewer(file) : new MonacoEditor(file);
	// 	ret.changeTrigger.add(() => this.onChange.trigger());
	// 	return ret;
	// }
	async openFile(id: string) {
		const currentIndex = this.openFilesOrder.findIndex(editor => editor.file.id == id);
		if (currentIndex != -1) {
			const editorFile = this.openFilesOrder[currentIndex];
			this.openFilesOrder.splice(currentIndex, 1);
			this.openFilesOrder.push(editorFile);
		} else {
			const file = await this.fs.getById(id) as MagicFile;
			if (!file?.isFile) return;
			const editorFile = new EditorFile(file);
			editorFile.changeTrigger.add(() => {
				this.onChange.trigger();
				this.onFilesChange.trigger();
			})
			this.openFiles.push(editorFile);
			this.openFilesOrder.push(editorFile);
		}
		this.updateEditorVisibility();
		this.storeState();
		this.onChange.trigger();
	}
	async closeFile(id: string) {
		const editorFile = this.openFilesOrder.find(editor => editor.file.id == id);
		if (editorFile?.isDirty && !await Modals.confirm('Unsaved changes', `You have unsaved changes.\n\nAre you sure you want to close this file?`)) return false;
		editorFile?.dispose();
		this.openFilesOrder = this.openFilesOrder.filter(editor => editor.file.id != id);
		this.openFiles = this.openFiles.filter(editor => editor.file.id != id);
		this.onChange.trigger();
		this.storeState();
		return true;
	}
	async close() {
		const dirty = this.openFiles.filter(editor => editor.isDirty).length;
		if (dirty && !await Modals.confirm('Unsaved changes', `You have unsaved changes.\n\nAre you sure you want to close this project?`)) return false;
		this.openFiles.forEach((editor) => editor.dispose());
		this.openFiles = [];
		this.openFilesOrder = [];
		this.fs.close();
		this.buildManager.dispose();
		return true;
	}
	moveFile = (path: string, targetPath: string) => this.volume.rename(path = sanitizePath(path), (sanitizePath(targetPath) + '/' + path.split('/').at(-1)))
	async createFile(path: string, content: string) {
		await this.volume.writeFile(path, content);
		this.onChange.trigger();
		this.onFilesChange.trigger();
	}
	download = async () => {
		const zip = await this.volume.zipFolder('');
		const blob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = this.info.name + '.zip';
		a.click();
	}
	async reset() {
		await this.volume.clear();
		// const meta = await this.volume.getMeta()
		// await this.volume.setMeta({ ...meta, modified: false });
		this.onChange.trigger();
	}
}