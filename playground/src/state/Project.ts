import { ProjectInfo, Manifest } from "./Types";
import { isBinary, MagicFile, MagicFS, sanitizePath, Trigger, Volume } from "@cmajor-playground/utilities";
import { App } from "./App";
import { Modals } from "../components/Modals";
import { FileEditorBase } from "../components/FileEditorBase";
import { FileViewer } from "../components/FileViewer";
import { BuildManager } from "./BuildManager";
import { MonacoEditor } from "../components/MonacoEditor";
import { mtype } from "../mtype";

export class Project {
	editors: FileEditorBase[] = [];
	editorsOrder: FileEditorBase[] = [];
	onChange = new Trigger;
	onFilesChange = new Trigger;
	fs: MagicFS;
	buildManager: BuildManager;
	constructor(public info: ProjectInfo, public volume: Volume) {
		this.fs = new MagicFS(volume);
		volume.watch(async (details) => {
			if (!this.info.modified) {
				console.trace(details);
				this.info.modified = true;
				volume.getMeta().then(async meta => {
					await volume.setMeta({ ...meta, modified: true });
					this.onChange.trigger();
				});
			}
			for (let detail of details.operations) {
				if (detail.type == 'volumeRemoved') document.location = document.location;
				if (detail.type == 'unlink') this.closeFile(detail.id);
			}
			this.onFilesChange.trigger();
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
		return this;
	}
	focusEditor(editor: FileEditorBase) {
		this.editorsOrder = this.editorsOrder.filter(e => e != editor);
		this.editorsOrder.push(editor);
		this.storeState();
		this.onChange.trigger();
	}
	storeState() {
		const state = {
			openFiles: this.editors.map(editor => editor.file.id),
			openFilesOrder: this.editorsOrder.map(editor => editor.file.id),
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
	private createEditor = (file: MagicFile) => {
		const ret = isBinary(mtype(file.path)) ? new FileViewer(file) : new MonacoEditor(file);
		ret.changeTrigger.add(() => this.onChange.trigger());
		return ret;
	}
	async openFile(id: string) {
		const currentIndex = this.editorsOrder.findIndex(editor => editor.file.id == id);
		if (currentIndex != -1) {
			const editorFile = this.editorsOrder[currentIndex];
			this.editorsOrder.splice(currentIndex, 1);
			this.editorsOrder.push(editorFile);
		} else {
			const file = await this.fs.getById(id) as MagicFile;
			if (!file?.isFile) return;
			const editorFile = this.createEditor(file);
			this.editors.push(editorFile);
			this.editorsOrder.push(editorFile);
		}
		this.storeState();
		this.onChange.trigger();
	}
	async closeFile(id: string) {
		const editor = this.editorsOrder.find(editor => editor.file.id == id);
		if (editor?.isDirty && !await Modals.confirm('Unsaved changes', `You have unsaved changes.\n\nAre you sure you want to close this file?`)) return false;
		this.editorsOrder = this.editorsOrder.filter(editor => editor.file.id != id);
		this.editors = this.editors.filter(editor => editor.file.id != id);
		this.onChange.trigger();
		this.storeState();
		return true;
	}
	async close() {
		const dirty = this.editors.filter(editor => editor.isDirty).length;
		if (dirty && !await Modals.confirm('Unsaved changes', `You have unsaved changes.\n\nAre you sure you want to close this project?`)) return false;
		this.editors.forEach((editor) => editor.dispose());
		this.editors = [];
		this.editorsOrder = [];
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
}