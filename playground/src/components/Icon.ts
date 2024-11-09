import { LitElement, TemplateResult, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import { loadIcons } from "../macros/loadIcons" with {type: 'macro'};
import { unsafeHTML } from 'lit/directives/unsafe-html';
import { COMMON_STYLES } from "./common-styles";
// import { MonacoEditor } from './MonacoEditor';
import { mtype } from "../mtype";
const icons = loadIcons('../../assets/file-icons', '../../assets/icons', '../../assets/icons/tabler-icons');
export class IconRegistry {
	static icons: Map<string, string | TemplateResult> = new Map;
	static register = (type: string, icon: string | TemplateResult) => {
		typeof icon === 'string' && icon.trim().startsWith('<') ? this.icons.set(type, html`${unsafeHTML(icon)}`) : this.icons.set(type, icon)
	}
	static getIcon = (key?: string): string | TemplateResult | undefined => this.icons.get(key ?? '')
	static {
		Object.entries(icons).forEach(([key, icon])=> this.register(key, icon as string));
		this.register('file', icons.default ?? icons.file);
	}
}
@customElement('ui-icon') export class Icon extends LitElement {
	@property({ type: Number }) width = 16;
	@property({ type: Number }) height = 16;
	@property({ type: String }) icon?: string;
	static styles = css`
		${COMMON_STYLES}
		:host {
			display: inline-flex;
			position: relative;
		}
		img, svg {
			object-fit: contain;
		}
		:host([stroke=currentColor]) svg {
			stroke: currentColor;
		}
		:host([fill=currentColor]) svg {
			fill: currentColor;
		}
		:host([currentColors]) svg {
			fill: currentColor;
			stroke: currentColor;
		}
	`;
	protected getIcon = () => IconRegistry.getIcon(this.icon)
	renderIcon = () => {
		const icon = this.getIcon();
		return typeof icon === 'string' ? html`<img src="${icon}" width="${this.width}" height="${this.height}">` : (icon ?? html``);
	}
	render = () => html`
		<style>
			img, svg {
				width: ${this.width}px;
				height: ${this.height}px;
			}
			:host {
				width: ${this.width}px;
				height: ${this.height}px;
			}
		</style>
		${this.renderIcon()}
	`;


}

@customElement('ui-file-icon') export class FileIcon extends Icon {
	@property({ type: String }) path?: string;
	getIcon = () => {
		const ext = this.path?.split('.').at(-1);
		if (ext && IconRegistry.getIcon(ext)) {
			this.removeAttribute('currentColors');
			return IconRegistry.getIcon(ext);
		}
		// const lang = MonacoEditor.getLanguage(ext!);
		// if (lang && IconRegistry.getIcon(lang)) {
		// 	this.removeAttribute('currentColors');
		// 	return IconRegistry.getIcon(lang);
		// }

		const mime = mtype(this.path!);
		this.setAttribute('currentColors', '');
		if (mime?.startsWith('audio')) return IconRegistry.getIcon('audio');
		if (mime?.startsWith('video')) return IconRegistry.getIcon('video');
		if (mime?.startsWith('image')) return IconRegistry.getIcon('image');
		return IconRegistry.getIcon('file');
	}
}
