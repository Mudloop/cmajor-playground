import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import { COMMON_STYLES } from "./common-styles";
import { Playground } from "./Playground";
import { FileEditorBase } from "./FileEditorBase";
export const CLOSE_ICON = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
@customElement('cmaj-tabs') export class Tabs extends LitElement {
	@property({ type: Object }) playground!: Playground;
	static styles = css`
		${COMMON_STYLES}
		:host {
			width:100%;
			max-width:100%;
			display: flex;
			flex-direction: row;
			justify-content: start;
			align-items: stretch;
			height: 38px;
			min-height: 38px;
			max-height: 38px;
			overflow-y: hidden;
			gap: 2px;
			position: relative;
			padding-top: 8px;
			background-color: #202223;
		}
		.tab {
			display: flex;
			flex-direction: row;
			cursor: pointer;
			align-items: center;
			justify-content: center;
			padding: 0px 8px;
			gap: 4px;
			position: relative;
			transition: background-color 0.2s ease;
		}
		.tab.active {
			background-color: #232627;
			color: #fff;
			border-top: 1px solid #e2b461;
			position: relative;
			top: 1px;
		}
		.tab:not(.active) {
			border-top: 1px solid transparent;
			padding-top: 1px;
		}
		.icon {
			left: 10px;
		}
		.close {
			transition: all 0.2s ease;
			right: 8px;
			top: 0;
			bottom: 0;
			opacity: 0;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.active .close {
			opacity: .5;
		}
		.close svg, .icon svg {
			stroke: currentColor;
			fill: currentColor;
		}
		.icon svg {
			width: 14px;
			height: 14px;
		}
		label {
			cursor: pointer;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			text-align:center;
			max-width:130px;
			width: 100%;
			font-size:11px;
			padding-right: 8px;
		}
		.tab:hover .close {
			opacity: 1;
		}
	`;
	protected firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);
		this.playground.onChange.add(() => this.requestUpdate());
	}

	render = () => this.playground.project!.editors.map(editor => this.rendertab(editor));
	rendertab = (editor: FileEditorBase) => html`
		<div class="tab ${editor == this.playground.project!.editorsOrder.at(-1) ? 'active' : ''}" @pointerdown=${() => this.playground.project!.focusEditor(editor)}>
			<ui-file-icon .path=${editor.file.name} width="16" height="16"></ui-file-icon>
			<label>
				${editor.isDirty ? '•' : ''}
				${editor.file.name}
			</label>
			<div class="close" @pointerdown=${(e: Event) => e.stopPropagation()} @click=${(e: MouseEvent) => this.close(editor, e)}>${CLOSE_ICON}</div>
		</div>
	`

	private close(editor: FileEditorBase, e: MouseEvent) {
		this.playground.close(editor);
		e.stopPropagation();
		e.preventDefault();
	}
}