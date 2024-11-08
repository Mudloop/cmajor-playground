import { customElement } from "lit/decorators";
import { css, html } from "lit";
import { FileEditorBase } from "./FileEditorBase";
import { mtype } from "../mtype";
import { COMMON_STYLES } from "./common-styles";

@customElement("cmaj-file-viewer") export class FileViewer extends FileEditorBase {

	static styles = css`
		:host {
			${COMMON_STYLES}
			display: flex;
			justify-content: center;
			align-items: center;
			width: 100%;
			height: 100%;
			background-color: #232627;
			flex-direction: column;
		}
		img, video {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}
	`;
	url?: string;
	protected onFirstContentLoad = async () => this.url = await this.getUrl();
	protected onContentUpdate() { }
	render = () => {
		console.log(this.url);
		if (!this.url) return html`<ui-loader></ui-loader>`
		const mime = mtype(this.file.path)!;
		if (mime.startsWith('audio')) return html`<audio controls><source src="${this.url}" type="${mime}"></audio>`;
		else if (mime.startsWith('video')) return html`<video controls><source src="${this.url}" type="${mime}"></video>`;
		else if (mime.startsWith('image')) return html`<img src="${this.url}">`;
		else return html`<h2>.${this.file.path.split('.').at(-1)} files are not supported</h2><code>Mime type: ${mime}</code>`;
	}
	getExtension = () => this.file.name.split('.').at(-1)?.toLowerCase()
	async getUrl() {
		// return new URL(`./$${this.file.fs.volumeId}/${this.file.path}`, document.location.href).href;
		const content = await this.file.content;
		const byteArray = content instanceof Uint8Array ? content : this.decodeBase64ToArray(content as string);
		const blob = new Blob([byteArray], { type: `audio/${this.getExtension()}` });
		return URL.createObjectURL(blob);
	}

	private decodeBase64ToArray(content: string) {
		const byteCharacters = atob(content as string);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
		return new Uint8Array(byteNumbers);
	}
	onDispose = () => this.url && URL.revokeObjectURL(this.url);
}