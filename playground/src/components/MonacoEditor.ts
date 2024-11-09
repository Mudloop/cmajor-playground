import { css, html, render, unsafeCSS } from "lit";
import { customElement } from "lit/decorators.js";
import monaco from '@cmajor-playground/bunaco';
import monacoCSS from "@cmajor-playground/bunaco/dist/monaco.css" with { type: 'text' };
import { unsafeHTML } from "lit/directives/unsafe-html";
import { FileEditorBase } from "./FileEditorBase";
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
			display: none;
		}
		#editor::after {
			content: '';
			position: absolute;
			inset: 0;
			
			pointer-events: none;
		}
		iframe {
			width: 100%;
			height: 100%;
			border: none;
		}
	`;
	protected async onFirstContentLoad() {
		this.setAttribute('tabindex', '0');
		const iframe = this.shadowRoot!.querySelector('iframe')!;
		iframe.src = './monaco.html';
		await new Promise(resolve => iframe.onload = resolve);
		await new Promise<void>(resolve => iframe.contentWindow!.addEventListener('message', (e) => {
			if (e.data == 'editorReady') resolve();
		}));

		(iframe.contentWindow as any).init(this.file, (content: string) => this.setEditorContent(content));
		iframe.contentDocument!.addEventListener('keydown', this.keydownHandler)
	}
	onDispose = () => (this.shadowRoot!.querySelector('iframe')!).src = '';
	render = () => html`<iframe></iframe><div id="editor" class="editor"></div>`
	onContentUpdate = () => ((this.shadowRoot!.querySelector('iframe')!).contentWindow as any).setContent(this.editorContent as string ?? '');
}

render(html`<style>${unsafeHTML(monacoCSS)}</style>`, document.body);