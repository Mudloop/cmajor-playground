import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import { COMMON_STYLES } from "./common-styles";
import { Playground } from "./Playground";
import { FileEditorBase } from "./FileEditorBase";
import { EditorFile } from "../state";
export const CLOSE_ICON = html`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
@customElement('cmaj-tabs') export class Tabs extends LitElement {
	@property({ type: Object }) playground!: Playground;
	static styles = css`
		${COMMON_STYLES}
		:host {
			width:100%;
			max-width:100%;
			display: flex;
			
			height: 38px;
			min-height: 38px;
			max-height: 38px;
			overflow-y: hidden;
			position: relative;
			background-color: #202223;
			visibility: hidden;
		}
		main {
			position: absolute;
			display: flex;
			flex-direction: row;
			justify-content: start;
			align-items: stretch;
			inset: 0;
			bottom: -20px;
			padding-bottom: 20px;
			overflow-x: auto;
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
			transition: all 0.2s ease;
			z-index: 1;
		}
		.tab.active {
			background-color: #303436;
			color: #fff;
			border-bottom: 1px solid #e2b461;
			position: relative;
		}
		.tab:not(.active) {
			border-bottom: 1px solid transparent;
			padding-top: 1px;
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
		.close svg {
			stroke: currentColor;
			fill: currentColor;
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
			padding-right: 4px;
		}
		ui-file-icon {
			padding-right: 8px;
		}
		.tab:hover .close {
			opacity: 1;
		}
	`;
	protected firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);
		this.playground.onChange.add(() => this.requestUpdate());
		setTimeout(() => {
			this.checkScroll(true);
			this.style.visibility = 'visible';
		}, 30);
	}

	firstScroll: boolean = true;
	prevSelected: any;
	updated() {
		if (this.prevSelected != this.playground.project!.openFilesOrder.at(-1)) {
			this.checkScroll();
		}
	}

	checkScroll(forced?: boolean) {
		const activeTab = this.shadowRoot!.querySelector('.active') as HTMLElement;
		if (!activeTab) return;
		const tabBar = this.shadowRoot!.querySelector('main') as HTMLElement;
		const tabLeft = activeTab.offsetLeft;
		const tabWidth = activeTab.offsetWidth;
		const containerCenter = tabBar.clientWidth / 2;
		const targetScrollPosition = tabLeft - containerCenter + (tabWidth / 2);
		tabBar.scrollTo({
			left: targetScrollPosition,
			behavior: forced ? 'instant' : 'smooth'
		});
		this.prevSelected = this.playground.project!.openFilesOrder.at(-1);
	}

	render = () => html`<main>${this.playground.project!.openFiles.map(file => this.rendertab(file))}</main>`;
	rendertab = (file: EditorFile) => html`
		<div class="tab ${file == this.playground.project!.openFilesOrder.at(-1) ? 'active' : ''}" @pointerdown=${() => this.playground.project!.focusEditor(file)}>
			<ui-file-icon .path=${file.file.name} width="16" height="16"></ui-file-icon>
			<label>
				${file.isDirty ? '•' : ''}
				${file.file.name}
			</label>
			<div class="close" @pointerdown=${(e: Event) => e.stopPropagation()} @click=${(e: MouseEvent) => this.close(file, e)}>${CLOSE_ICON}</div>
		</div>
	`

	private close(file: EditorFile, e: MouseEvent) {
		this.playground.close(file);
		e.stopPropagation();
		e.preventDefault();
	}
}