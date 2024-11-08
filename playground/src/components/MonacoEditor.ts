import { css, html, render, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import monaco from '@cmajor-playground/bunaco';
import monacoCSS from "@cmajor-playground/bunaco/dist/monaco.css" with { type: 'text' };
import { unsafeHTML } from "lit/directives/unsafe-html";
import { FileEditorBase } from "./FileEditorBase";
// monaco.languages.typescript.typescriptDefaults.addExtraLib()
@customElement("cmaj-monaco-editor") export class MonacoEditor extends FileEditorBase {
	static getLanguage = (extension?: string) => (monaco.languages.getLanguages().find(lang => lang.extensions?.includes('.' + extension) || lang.extensions?.includes(extension!)))?.id
	static styles = css`
		${FileEditorBase.styles}
		${unsafeCSS(monacoCSS)}
		:host {
			overflow: hidden;
			background-color: #232627;
			position: relative;
			height: 100%;
			width: 100%;
		}
		#editor {
			position: absolute;
			inset: 6px;
		}
		#editor::after {
			content: '';
			position: absolute;
			inset: 0;
			
			pointer-events: none;
		}
	`;
	private monaco?: monaco.editor.IStandaloneCodeEditor;
	private observer?: ResizeObserver;

	protected async onFirstContentLoad() {
		this.setAttribute('tabindex', '0');
		const content = await this.file.content as string;
		const editorContainer = this.shadowRoot!.getElementById('editor')!;
		let lang: string | undefined = content.length > 1000000 ? undefined : MonacoEditor.getLanguage(this.file.path?.split('.').pop()) ?? 'plaintext';
		monaco.editor.defineTheme("vs-dark", {
			base: "vs-dark",
			inherit: true,
			rules: [],
			colors: { 'editor.background': "#232627" }
		});
		this.monaco = monaco.editor.create(editorContainer, {
			value: content,
			language: lang,
			fontSize: 10.5,
			theme: 'vs-dark',
			tabSize: 4,
			insertSpaces: false,
			useTabStops: true
		});
		

		this.monaco.onDidChangeModelContent(() => this.setEditorContent(this.monaco!.getValue()));
		this.observer = new ResizeObserver(() => this.checkSize());
		this.observer.observe(editorContainer);
		window.addEventListener('resize', () => this.checkSize());
		this.checkSize();
		
	}

	private checkSize(): void {
		const size = this.getBoundingClientRect();
		this.monaco?.updateOptions({ minimap: { enabled: size.width > 900 } });
		this.monaco?.layout();
	}

	onDispose() {
		this.monaco?.dispose();
		this.observer?.disconnect();
		delete this.observer;
		delete this.monaco;
	}
	render = () => html`<div id="editor" class="editor"></div>`
	updated = () => this.monaco?.layout();
	onContentUpdate = () => this.monaco?.setValue(this.editorContent as string ?? '');
}

render(html`<style>${unsafeHTML(monacoCSS)}<style>`, document.body);