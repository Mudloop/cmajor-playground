import monaco from '@cmajor-playground/bunaco';
import { MagicFile } from '@cmajor-playground/utilities';
import { LanguageDefinition, languages } from './languages';
const editorContainer = document.getElementById('editor')!;
class Editor {
	getLanguage = (extension?: string) => (monaco.languages.getLanguages().find(lang => lang.extensions?.includes('.' + extension) || lang.extensions?.includes(extension!)))?.id
	registerLanguage(lang: LanguageDefinition): void {
		monaco.languages.register(lang.language);
		if (lang.configutation) monaco.languages.setLanguageConfiguration(lang.language.id, lang.configutation);
		if (lang.themeData) monaco.editor.defineTheme("vs-dark", lang.themeData);
		if (lang.hoverProvider) monaco.languages.registerHoverProvider(lang.language.id, lang.hoverProvider);
		if (lang.tokensProvider) monaco.languages.setMonarchTokensProvider(lang.language.id, lang.tokensProvider);
		if (lang.completionItemProvider) monaco.languages.registerCompletionItemProvider(lang.language.id, lang.completionItemProvider);
		if (lang.documentFormattingEditProvider) monaco.languages.registerDocumentFormattingEditProvider(lang.language.id, lang.documentFormattingEditProvider);
	}
	monaco!: monaco.editor.IStandaloneCodeEditor;
	constructor(public file: MagicFile, public callback: (content: string) => void) {
		languages.forEach(language => this.registerLanguage(language));
		const json = monaco.languages.getLanguages().find(lang => lang.extensions?.includes('.json'))
		json!.extensions!.push('.cmajorpatch');
		monaco.editor.defineTheme("vs-dark", {
			base: "vs-dark",
			inherit: true,
			rules: [],
			colors: { 'editor.background': "#232627" }
		});
		this.init();
	}
	async init() {
		const content = await this.file.content as string;
		const lang: string | undefined = content.length > 1000000 ? undefined : this.getLanguage(this.file.path?.split('.').pop()) ?? 'plaintext';
		this.monaco = monaco.editor.create(editorContainer, {
			value: content,
			language: lang,
			theme: 'vs-dark',
			fontSize: 10.5,
			tabSize: 4,
			insertSpaces: false,
			useTabStops: true
		});

		this.monaco.onDidChangeModelContent(() => this.setEditorContent(this.monaco!.getValue()));
		window.addEventListener('resize', () => this.checkSize());
	}
	setEditorContent(val: string): any {
		this.callback(val);
	}
	private checkSize(): void {
		const size = document.body.getBoundingClientRect();
		this.monaco?.updateOptions({ minimap: { enabled: size.width > 900 } });
		this.monaco?.layout();
	}
}

(window as any).init = (file: MagicFile, callback: (content: string) => void) => {
	const editor = new Editor(file, callback);
	(window as any).setContent = (content: string) => editor.monaco.setValue(content)
}
