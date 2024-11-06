import { customElement } from "lit/decorators";
import { css, html } from "lit";
import { FileEditorBase } from "./FileEditorBase";
import { mtype } from "../mtype";

@customElement("cmaj-file-viewer") export class FileViewer extends FileEditorBase {

	static styles = css`
		:host {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 100%;
			height: 100%;
			background-color: #232627;
		}
		img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
		}
	`;
	url?: string;
	protected onFirstContentLoad = async () => this.url = await this.getUrl();
	protected onContentUpdate() { }
	render = () => {
		if (!this.url) return html`<ui-loader></ui-loader>`
		const mime = mtype(this.file.path)!;
		if (mime.startsWith('audio')) return html`<audio controls><source src="${this.url}" type="${mime}"></audio>`;
		if (mime.startsWith('video')) return html`<video controls><source src="${this.url}" type="${mime}"></video>`;
		if (mime.startsWith('image')) return html`<img src="${this.url}">`;
	}
	getExtension = () => this.file.name.split('.').at(-1)?.toLowerCase()
	async getUrl() {
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