import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators";
import { Layout, Playground } from "./Playground";
import { COMMON_STYLES } from './common-styles';
import { ContextManager } from '@cmajor-playground/utilities';

@customElement('cmaj-header') export class Header extends LitElement {
	@property({ type: Object }) playground!: Playground;
	@property({ type: String, attribute: true }) size?: 'sm' | 'md' | 'lg';
	@property({ type: Boolean, attribute: true }) embedded = false;
	@property({ type: Boolean, attribute: true }) enlarged = false;
	@property({ type: Boolean, attribute: 'preview-mode' }) previewMode = false;
	static styles = css`
		${COMMON_STYLES}
		:host {
			height: 38px;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			position: relative;
		}
		:host::after {
			content: '';
			position: absolute;
			border-bottom: 1px solid #4e4e4e;
			inset: 0;
			pointer-events: none;
		}
		.actions {
			display: flex;
			gap: 4px;
			align-items: center;
			padding: 0 8px;
		}
		ui-icon {
			cursor: pointer;
			opacity: .55;
			position: relative;
		}
		ui-icon:after {
			content: '';
			position: absolute;
			inset: -4px;
			background-color: transparent;
		}
		ui-icon:hover { opacity: .8; }
		ui-icon.selected { opacity: 1; }
		:host([preview-mode]) #play { display: none; }
		:host(:not([preview-mode])) #edit { display: none; }

		:host(:not([size="sm"])) .actions-left { display: none; }
		:host(:not([size="lg"])) #split-bottom { display: none; }
		:host(:not([size="lg"])) #split-right { display: none; }
		:host([size="lg"]) #play { display: none; }
		:host([size="lg"]) #edit { display: none; }
		button {
			align-self: center;
			padding: 4px 8px;
			background: transparent;
			border-radius: 4px;
			border: 1px solid #ffffff33;
		}
	`;
	protected updated(_changedProperties: PropertyValues): void {
		if (_changedProperties.has('previewMode')) {
			if (this.previewMode) this.setAttribute('preview-mode', '');
			else this.removeAttribute('preview-mode');
		}
	}
	render = () => html`
		<div class="actions actions-left"><ui-icon icon="menu" @click=${() => this.playground.setAttribute('menu-open', '')}></ui-icon></div>
		<cmaj-tabs part="tabs" .playground=${this.playground}></cmaj-tabs>
		<div class="actions">
			<ui-icon width=20 height=20 id="split-bottom" icon="split-bottom" currentColors @click=${() => this.playground.setAttribute('layout', Layout.Vertical)}></ui-icon>
			<ui-icon width=20 height=20 id="split-right" icon="split-right" currentColors @click=${() => this.playground.setAttribute('layout', Layout.Horizontal)}></ui-icon>
			<button @click=${() => this.playground.removeAttribute('preview-mode')} id="edit"><ui-icon width=14 height=14 icon="edit" currentColors></ui-icon> Editor</button>
			<button @click=${() => this.playground.setAttribute('preview-mode', '')}  id="play"><ui-icon width=14 height=14 icon="player-play" currentColors></ui-icon> Player</button>
			${this.embedded && this.enlarged ? html`<ui-icon width=20 height=20 currentColors class="selected" icon="shrink" @click=${(e: any) => this.playground.sendRequest('shrink')}></ui-icon>` : ''}
			<ui-icon class="${ContextManager.muted ? 'off' : 'selected'}" width="20" height="20" currentColors icon="${ContextManager.muted ? 'muted' : 'unmuted'}" @click=${() => this.playground.toggleMute()}></ui-icon>
			<!--ui-icon width=20 height=20 id="settings" icon="tabler-settings-2" currentStroke @click=${() => this.playground.setAttribute('preview-mode', '')}></ui-icon-->
			${this.embedded && !this.enlarged ? html`<ui-icon width=20 height=20 currentColors icon="enlarge" @click=${(e: any) => this.playground.sendRequest('enlarge')}></ui-icon>` : ''}
		</div>
	`
}