import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Project } from "../state";
@customElement("cmaj-monaco-container") export class MonacoContainer extends LitElement {
	@property({ type: String }) focusedFileId?: string;
	@property({ type: Object }) project!: Project;
	static styles = css`
		:host {
			display: block;
			flex:1;
			height: 100%;
			width: 100%;
			border-top: none;
			background-color: #232627;
		}
		iframe {
			width: 100%;
			height: 100%;
			border: none;
		}
	`;
	iframe!: HTMLIFrameElement;
	iframeInitialized = false;
	protected firstUpdated(_changedProperties: PropertyValues) {
		super.firstUpdated(_changedProperties);
		const iframe = this.iframe = this.shadowRoot!.querySelector('iframe')!;
		iframe.onload = this.setupIframe;
		iframe.src = './monaco.html';
	}
	protected updated(_changedProperties: PropertyValues) {
		if (!this.iframeInitialized) return;
	}



	setupIframe = async () => {
		const iframe = this.iframe;
		this.iframeInitialized = false;
		await new Promise<void>(resolve => iframe.contentWindow!.addEventListener('message', (e) => e.data == 'editorReady' && resolve()));
		const connection: any = (this.iframe.contentWindow as any).connection;
		connection.init(this.project);
		this.iframeInitialized = true;
	}
	render = () => html`<iframe></iframe>`
}