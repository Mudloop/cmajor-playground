import monaco from '@cmajor-playground/bunaco';
import { languages } from './languages';
import { getLanguage, registerLanguage } from './helpers';
import { EditorFile, Project } from '../state';
import { Volume } from '@cmajor-playground/utilities';
import { Editor } from './Editor';
class EditorManager {

	static project: Project;
	static volume: Volume;
	static editors: Record<string, Editor> = {};
	static models: Record<string, monaco.editor.ITextModel> = {};
	static get focusedEditor() {
		return Object.values(this.editors).find(editor => editor.file.file.id == this.project.focusedFile?.file.id);
	}
	static {
		languages.forEach(language => registerLanguage(language));
		const json = monaco.languages.getLanguages().find(lang => lang.extensions?.includes('.json'))
		json!.extensions!.push('.cmajorpatch');
		monaco.editor.defineTheme("vs-dark", {
			base: "vs-dark",
			inherit: true,
			rules: [],
			colors: { 'editor.background': "#232627" }
		});
		window.postMessage('editorReady');
	}
	static init = async (project: Project) => {
		this.project = project;
		this.volume = this.project.volume;
		this.project.onChange.add(this.update);
		this.project.onFilesChange.add(this.update);
		this.update();
	}
	static update = async () => {
		const promises = this.project.openFiles.map(async file => {
			const model = await this.getModel(file);
			const editor = this.getEditor(file, model)!;
			editor.toggle(file == this.project.focusedFile);
		})
		await Promise.all(promises);
		Object.keys(this.editors).forEach(id => {
			if (!this.project.openFiles.find(file => file.file.id == id)) {
				this.editors[id].dispose();
				delete this.editors[id];
			}
		})
	}
	static getEditor(file: EditorFile, model: monaco.editor.ITextModel) {
		return this.editors[file.file.id] ??= new Editor(file, model);
	}
	static async getModel(file: EditorFile) {
		const content = await file.file.content as string;
		const lang: string | undefined = content.length > 1000000 ? undefined : getLanguage(file.file.path?.split('.').pop()) ?? 'plaintext';
		return this.models[file.file.id] ??= monaco.editor.createModel(content, lang, monaco.Uri.parse(`file://${file.file.path}`));
	}
	// static keydownHandler = async (e: KeyboardEvent) => {
	// 	if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
	// 		e.preventDefault();
	// 		const focusedEditor = this.focusedEditor;
	// 		if (focusedEditor == null) return;
	// 		focusedEditor.file.save(focusedEditor.monaco.getmo)
	// 		// await this.file.write(this.editorContent!);
	// 		// this.storedContent = this.editorContent;
	// 		// this.isDirty = false;
	// 		// this.changeTrigger.trigger();
	// 	}
	// }
}
(window as any).connection = EditorManager;