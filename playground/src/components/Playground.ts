import logo from '../../assets/img/logo.png' with { type: 'file' };
import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import { Project } from '../state/Project';
import { FileEditorBase } from './FileEditorBase';
import { COMMON_STYLES } from './common-styles';
import { keyed } from 'lit/directives/keyed';
import { Modals } from './Modals';
import { ContextManager, Trigger } from '@cmajor-playground/utilities';
import { App, examples, ZipLoader } from '../state';
export enum Layout { Horizontal = 'horizontal', Vertical = 'vertical' }
import { FaustBuilder, CmajorBuilder } from '@cmajor-playground/builders';
import { CmajLanguageDefinition, FaustLanguageDefinition } from '../languages';
import { defaultTemplate, uiTemplate } from '../templates';
await App.init({
	vfs: 'CmajPlayground', builds: 'builds',
	examples,
	templates: { default: defaultTemplate, ui: uiTemplate },
	sources: { zip: ZipLoader },
	builders: [FaustBuilder, CmajorBuilder],
	languages: [CmajLanguageDefinition, FaustLanguageDefinition],
	serviceWorker: new URL('../../service.worker.js', import.meta.url)
});
@customElement('cmaj-playground') export class Playground extends LitElement {

	@property({ type: String, attribute: true }) layout: Layout = Layout.Horizontal;
	@property({ type: String }) size?: 'sm' | 'md' | 'lg';
	@property({ type: Boolean, attribute: 'menu-open' }) menuOpen = false;

	@property({ type: Boolean, attribute: true }) enlarged: boolean = false;
	embedded = window.top != window;
	project?: Project; observer?: ResizeObserver;
	onChange: Trigger = new Trigger();

	static styles = css`
		${COMMON_STYLES}
		:host {
			width: 100%;
			height: 100%;
			position: relative;
			background-color: #202223;
			display: flex;
			flex-direction: row;
			color: #b3b0aa;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
			font-size: 12px;
		}
		dialog {
			color: inherit;
		}
		* {
			box-sizing: border-box;
			user-select: none;
		}
		.logo {
			display: flex;
			padding: 20px 8px;
			padding-bottom: 12px;
			gap: 8px;
			position: relative;
			width: fit-content;
		}
		.logo img {
			width: 100%;
			max-width: 150px;
			min-width: 150px;
			height: auto;
			
			opacity: .65;
		}
		.logo span {
			background-color: #fff;
			opacity: .8;
			padding: 2px 4px;
			font-size: 7px;
			border-radius: 4px;
			margin-right: 4px;
			color: black;
			text-transform: uppercase;
			font-weight: 900;
			letter-spacing: 1px;
			display: flex;
			align-items: center;
			align-self: start;
			position: absolute;
			right: 0;
			top: 17px;
		}
		#editors>*:not(:last-child) { display: none; }
		#editors { flex: 1; }
		header {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			position: relative;
		}
		header::after {
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
		:host([preview-mode]) #play { opacity: 1; }
		:host(:not([preview-mode])) #edit { opacity: 1; }
		:host([layout="vertical"]) #split-bottom { opacity: 1; }
		:host(:not([layout="vertical"])) #split-right { opacity: 1; }
		:host(:not([size="lg"])) #split-bottom { display: none; }
		:host(:not([size="lg"])) #split-right { display: none; }
		:host([size="lg"]) #play { display: none; }
		:host(:not([size="sm"])) .actions-left { display: none; }
		:host([size="lg"]) #edit { display: none; }
		
		:host([size="sm"]) #main-splitter { display: none; }
		:host([size="md"][preview-mode]) #main-splitter { display: none; }
		:host(:not([size="lg"])) #content-splitter { display: none; }
		#editor-split { position: relative; }
		:host([size="sm"]:not([preview-mode])) #preview { display: none !important; }
		:host([size="md"]:not([preview-mode])) #preview { display: none !important; }
		:host([size="sm"][preview-mode]) #editors { display: none !important; }
		:host([size="md"][preview-mode]) #editors { display: none !important; }
		:host([size="sm"][preview-mode]) #preview, :host([size="md"][preview-mode]) #preview {
			flex-shrink: 0 !important;
			flex-grow: 1 !important;
			flex-basis: 100% !important;
			width: 100%;
		}
		
		
		.none {
			background-color: #191b1b;
			display: flex;
			flex: 1;
			justify-content: center;
			align-items: center;
			font-size: 20px;
			color: #b3b0aa;
			height: 100%;
		}
		:host([size="sm"]) #sidebar {
			position: absolute;
			z-index: 1000;
			height: 100%;
			background-color: #202223;
			overflow-y: auto;
			box-shadow: 10px 0 80px #00000088;
			padding: 6px;
			border-right: 1px solid #ffffff22;
		}
		:host([embedded]:not([enlarged])) .logo {
			display: none;
		}
		#sidebar {
			box-shadow: inset 0 0 50px #00000022, inset 0 0 8px 1px #00000088;
			transition: transform 0.25s ease;
			transform-origin: left;
			width: 200px;
			overflow: hidden;
			display: flex;
			flex-direction: column;position: relative;
			left: 0;
			margin: 0;
			background-color: transparent;
			padding: 0;
			border: none;
			height: 100%;
			outline: none !important;
		}
		:host([size="sm"]:not([menu-open])) #sidebar { transform: scaleX(0) translateX(-50%); }
		:host([size="md"][preview-mode])
			#sidebar {
				transform: scaleX(0) translateX(-50%);
				position: absolute;
			}
		@keyframes sidebarOpen {
			0% {
				transform: scaleX(0) translateX(-50%);
			}
			80% {
				transform: scaleY(1.1) scaleX(1.1) translateX(0);
			}
			100% {
				transform: scaleX(1) translateX(0);
			}
		}
		:host([size="sm"][menu-open]) #sidebar { animation: sidebarOpen 0.2s ease-out;}
		.sidebar-top {
			min-height: 38px;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid #4e4e4e;
		}
		.sidebar-top h3 {
			flex: 1;
			text-align: center;
			justify-content: center;
		}
		.sidebar-close {
			display: flex;
			justify-content: flex-end;
			padding: 4px;
		}
		:host([size=lg]) .sidebar-close, :host([size=md]) .sidebar-close {
			display: none;
		}

		.gutter {
			width: 5px;
			position: relative;
		}
		.gutter::after {
			content: '';
			inset: 1px;
			opacity: 0;
			background-color: #e2b461;
			position: absolute;
		}
		#content {
			flex: 1;
			display: flex;
			flex-direction: column;
		}
		#content-split {
			flex: 1;
			display: flex;
			flex-direction: row;
			overflow: hidden;
		}
		:host([layout="vertical"]) #content-split { flex-direction: column; }
		:host(:not([layout="vertical"])) #preview {
			width: max(300px, 30%);
			max-width: 100%;
		}
		:host([layout="vertical"]) #preview { height: 30%; }
		flex-splitter {
			position: relative;
			background-color: transparent;
		}
		flex-splitter::after {
			position: absolute;
			content: '';
			inset: -4px;
			z-index: 1000;
		}
		#content-splitter::after {
			left: -1px;
			right: -10px;
		}
		flex-splitter:hover {
			background-color: #e2b461;
			transition: all 0.2s ease .1s;
		}
	`;
	hideProjectPanel: boolean = false;

	connectedCallback(): void {
		super.connectedCallback();
		this.observer ??= new ResizeObserver(() => this.checkSize());
		this.observer?.observe(this);
		window.addEventListener('resize', this.checkSize);
		if (this.embedded) this.setAttribute('embedded', '');
	}

	protected async firstUpdated(_changedProperties: PropertyValues) {
		let qs = new URLSearchParams(location.search);
		this.hideProjectPanel = qs.get('project-panel') == 'false';
		App.vfs.watch((_) => {
			this.onChange.trigger();
			this.requestUpdate();
		});
		window.addEventListener('message', (e) => {
			switch (e.data.type) {
				case 'enlarged': this.setAttribute('enlarged', ''); break;
				case 'shrunken': this.removeAttribute('enlarged'); break;
			}
		});
		Modals.root = this.shadowRoot!;
		this.setAttribute('layout', this.layout);
		let demo = qs.get('demo')
		if (demo) {
			const url = Object.entries(examples).find(([key, url]) => key == demo)?.[1];
			const info = await App.importProject(import.meta.resolve(url!));
			await this.loadProject(info!.id);
		} else {
			await this.loadProject();
		}
		this.requestUpdate();
	}

	protected updated(_changedProperties: PropertyValues): void {
		if (_changedProperties.has('layout')) {
			const splitter = this.shadowRoot!.getElementById('content-splitter') as LitElement;
			splitter?.requestUpdate();
		}
		if (_changedProperties.has('menuOpen')) {
			console.log('menu-open', this.menuOpen);
			const dialog = this.shadowRoot!.querySelector('dialog') as HTMLDialogElement;
			dialog?.close();
			if (this.getAttribute('menu-open')) dialog?.showModal();
		}
	}

	private checkSize = () => {
		const width = this.getBoundingClientRect().width;
		if (width < 900) {
			this.setAttribute('size', width < 700 ? 'sm' : 'md');
			return;
		}
		this.setAttribute('size', 'lg');
	};
	private sendRequest = (type: string, data?: any) => window.postMessage({ type, data }, '*');

	async loadProject(id?: string) {
		if (id && id == this.project?.info.id) return;
		if (this.project && !await this.project.close()) {
			this.requestUpdate();
			return false;
		}
		this.project = await App.openProject(id);
		this.project.onChange.add(() => {
			this.requestUpdate();
			this.onChange.trigger();
		});
		this.onChange.trigger();
		this.requestUpdate();
		return true;
	}
	render = () => this.project ? this.renderUI() : html`<ui-loader></ui-loader>`;
	private renderUI = () => html`
		<dialog open id="sidebar">
			<div class="sidebar-top">
				${this.hideProjectPanel ? html`
					<h3>${this.project!.info.name}</h3>
				` : html`
					<div class="logo"><img src="${new URL(logo, import.meta.url)}"><span>BETA</span></div>
				`}
				<div class="sidebar-close">
					<ui-icon icon="close" currentColors @click=${() => this.removeAttribute('menu-open')}></ui-icon>
				</div>
			</div>
			
			${this.hideProjectPanel ? html`
				${this.project?.info.modified ? html`<button @click=${() => this.resetProject()}>Reset</button>` : ''}
			` : html`<cmaj-projects .playground=${this}></cmaj-projects>`}
			${keyed(this.project!.info.id, html`<cmaj-explorer .playground=${this}></cmaj-explorer>`)}
		</dialog>
		<flex-splitter id="main-splitter" attach="prev"></flex-splitter>
		<div id="content">
			<header>
				<div class="actions actions-left">
					<ui-icon icon="menu" @click=${() => this.setAttribute('menu-open', '')}></ui-icon>
				</div>
				<cmaj-tabs .playground=${this}></cmaj-tabs>
				<div class="actions">
					<ui-icon width=20 height=20 id="split-bottom" icon="split-bottom" currentColors @click=${() => this.setAttribute('layout', Layout.Vertical)}></ui-icon>
					<ui-icon width=20 height=20 id="split-right" icon="split-right" currentColors @click=${() => this.setAttribute('layout', Layout.Horizontal)}></ui-icon>
					<ui-icon width=20 height=20 id="edit" icon="edit" currentColors @click=${() => this.removeAttribute('preview-mode')}></ui-icon>
					<ui-icon width=20 height=20 id="play" icon="play" currentColors @click=${() => this.setAttribute('preview-mode', '')}></ui-icon>
					${this.embedded && this.enlarged ? html`<ui-icon width=20 height=20 currentColors class="selected" icon="shrink" @click=${(e: any) => this.sendRequest('shrink')}></ui-icon>` : ''}
					<ui-icon width=20 height=20 id="settings" icon="tabler-settings-2" currentStroke @click=${() => this.setAttribute('preview-mode', '')}></ui-icon>
					${this.embedded && !this.enlarged ? html`<ui-icon width=20 height=20 currentColors icon="enlarge" @click=${(e: any) => this.sendRequest('enlarge')}></ui-icon>` : ''}
					<ui-icon class="${ContextManager.muted ? 'off' : 'selected' }" width="20" height="20" currentColors icon="${ContextManager.muted? 'muted' : 'unmuted'}" @click=${()=>this.toggleMute()}></ui-icon>
				</div>
			</header>
			<div id="content-split">
				<div id="editors" style="overflow: hidden;">
					<div class="none">Open a file to start coding</div>
					${this.project!.editorsOrder}
				</div>
				<flex-splitter id="content-splitter" attach="next"></flex-splitter>
				<div id="preview" style="display: flex; overflow: hidden;">${keyed(this.project!.info.id, html`<cmaj-products position=${this.layout == Layout.Vertical ? 'bottom' : 'right'} .buildManager=${this.project!.buildManager}></cmaj-products>`)}</div>
			</div>
		</div>
	`;
	closeProject = () => this.loadProject();
	close = async (editor: FileEditorBase) => (await this.project?.closeFile(editor.file.id)) && this.requestUpdate();
	private toggleMute() {
		ContextManager.toggleMute();
		this.requestUpdate();
	}

	async resetProject() {
		if (this.project!.info.modified) {
			if (!await Modals.confirm('Reset project?', `Are you sure you want to reset '${this.project?.info.name}'?`)) return;
		}
		await App.deleteProject(this.project!.info.id);
		let qs = new URLSearchParams(location.search);
		let demo = qs.get('demo')
		if (demo) {
			const url = Object.entries(examples).find(([key, url]) => key == demo)?.[1];
			const info = await App.importProject(import.meta.resolve(url!));
			await this.loadProject(info!.id);
		} else {
			await this.loadProject();
		}
	}
}