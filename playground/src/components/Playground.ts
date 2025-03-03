
import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import { Project } from '../state/Project';
import { COMMON_STYLES } from './common-styles';
import { keyed } from 'lit/directives/keyed';
import { Modals } from './Modals';
import { ContextManager, Trigger } from '@cmajor-playground/utilities';
import { App, EditorFile, examples, ProjectInfo, ZipLoader } from '../state';
export enum Layout { Horizontal = 'horizontal', Vertical = 'vertical' }
import { FaustBuilder, CmajorBuilder } from '@cmajor-playground/builders';

import { defaultTemplate, uiTemplate } from '../templates';
await App.init({
	vfs: 'CmajPlaygroundProjects', builds: 'builds',
	examples,
	templates: { default: defaultTemplate, ui: uiTemplate },
	sources: { zip: ZipLoader },
	builders: [FaustBuilder, CmajorBuilder],
	serviceWorker: new URL('../../service.worker.js', import.meta.url)
});
@customElement('cmaj-playground') export class Playground extends LitElement {

	@property({ type: String, attribute: true }) layout: Layout = Layout.Horizontal;
	@property({ type: String, attribute: true }) size?: 'sm' | 'md' | 'lg';
	@property({ type: Boolean, attribute: 'menu-open' }) menuOpen = false;

	@property({ type: Boolean, attribute: true }) enlarged: boolean = false;
	@property({ type: Boolean, attribute: 'preview-mode' }) previewMode: boolean = false;
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
		* {
			box-sizing: border-box;
			user-select: none;
		}
		
		#editors { flex: 1; }
		
		
		
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
		:host([size="sm"]) #sidebar::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: -1;
			background: #00000017;
		}
		:host([embedded]:not([enlarged])) .logo {
			display: none;
		}
		:host([size="md"]) #sidebar {
			width: 160px;
		}
		:host([size="sm"]:not([menu-open])) #sidebar { transform: scaleX(0) translateX(-50%); }
		:host([size="md"][preview-mode]) #sidebar {
			transform: scaleX(0) translateX(-50%);
			position: absolute;
		}
		:host(:not([size="lg"])[preview-mode]) cmaj-header::part(tabs) {
			transform: scaleX(0);
		}
		:host(:not([size="lg"])[preview-mode]) cmaj-products::part(container) {
			padding: 0;
			gap: 0;
		}
		:host(:not([size="lg"])[preview-mode]) cmaj-products::part(header) {
			min-height: 38px;
			align-items: center;
			padding-right: 160px;
			flex-direction: row;
		}
		:host(:not([size="lg"])[preview-mode]) cmaj-header {
			position: fixed;
			right: 0;
			z-index: 100000;
		}
		:host(:not([size="lg"])[preview-mode]) cmaj-header::after {
			display: none;
		}
		:host(:not([size="lg"])[preview-mode]) cmaj-header::part(menu-button) {
			display: none;
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
		
		:host([size=lg]) .sidebar-close, :host([size=md]) .sidebar-close {
			display: none;
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
		ui-icon {
			cursor: pointer;
		}
		// iframe {
		// 	width: 100%;
		// 	height: 100%;
		// 	border: none;
		// }
	`;
	hideProjectPanel: boolean = false;
	hideKeyboard: boolean = false;

	connectedCallback(): void {
		super.connectedCallback();
		this.observer ??= new ResizeObserver(() => this.checkSize());
		this.observer?.observe(this);
		window.addEventListener('resize', this.checkSize);
		if (this.embedded) this.setAttribute('embedded', '');
	}

	protected async firstUpdated(_changedProperties: PropertyValues) {
		let qs = new URLSearchParams(location.search);
		this.hideProjectPanel = qs.get('hide-project-panel') == 'true';
		this.hideKeyboard = qs.get('hide-keyboard') == 'true';
		if (qs.get('preview-mode') == 'true') this.setAttribute('preview-mode', '');
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
			await this.loadProject(info!.id, false);
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
	}

	private checkSize = () => {
		const width = this.getBoundingClientRect().width;
		if (width < 900) {
			this.setAttribute('size', width < 700 ? 'sm' : 'md');
			return;
		}
		this.setAttribute('size', 'lg');
	};
	sendRequest = (type: string, data?: any) => window.postMessage({ type, data }, '*');

	async loadProject(id?: string, remember: boolean = true) {
		if (id && id == this.project?.info.id) return;
		if (this.project && !await this.project.close()) {
			this.requestUpdate();
			return false;
		}
		this.project = await App.openProject(id, remember);
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
		<cmaj-sidebar id="sidebar" .hideProjectPanel=${this.hideProjectPanel} .playground=${this}>
			<div class="sidebar-close" slot="close">
				<ui-icon icon="close" currentColors @click=${() => this.removeAttribute('menu-open')}></ui-icon>
			</div>
		</cmaj-sidebar>
		<flex-splitter id="main-splitter" attach="prev"></flex-splitter>
		<div id="content">
			<cmaj-header size=${this.size} layout=${this.layout} .previewMode=${this.previewMode} .embedded=${this.embedded} .enlarged=${this.enlarged} .playground=${this}></cmaj-header>
			<div id="content-split">
				${keyed(this.project!.info.id, html`
					<div id="editors" style="overflow: hidden;">
						<div class="none ${this.project?.focusedFile ? 'hidden' : ''}">Open a file to start coding</div>
						<cmaj-monaco-container .project=${this.project} .focusedFileId=${this.project?.focusedFile?.file.id} class="${this.project?.focusedFile?.useMonaco ? '' : 'hidden'}"></cmaj-monaco-container>
						${!this.project?.focusedFile || this.project?.focusedFile?.useMonaco ? '' : html`
							<cmaj-file-viewer .file=${this.project.focusedFile.file}></cmaj-file-viewer>
						`}
					</div>
					<flex-splitter id="content-splitter" attach="next"></flex-splitter>
					<div id="preview" style="display: flex; overflow: hidden;"><cmaj-products .hideKeyboard=${this.hideKeyboard} position=${this.layout == Layout.Vertical ? 'bottom' : 'right'} .buildManager=${this.project!.buildManager}></cmaj-products></div>
				`)}
			</div>
		</div>
	`;
	closeProject = () => this.loadProject();
	close = async (editor: EditorFile) => (await this.project?.closeFile(editor.file.id)) && this.requestUpdate();
	toggleMute() {
		ContextManager.toggleMute();
		this.requestUpdate();
	}

	async resetProject(projectInfo?: ProjectInfo) {
		projectInfo ??= this.project!.info;
		if (projectInfo.version > 0) {
			if (!await Modals.confirm('Reset project?', `Are you sure you want to reset '${projectInfo.name}'?`)) return;
		}
		// await App.deleteProject(projectInfo.id);
		// if (projectInfo.id == this.project?.info.id) {
		// 	let qs = new URLSearchParams(location.search);
		// 	let demo = qs.get('demo')
		// 	if (demo) {
		// 		const url = Object.entries(examples).find(([key, url]) => key == demo)?.[1];
		// 		const info = await App.importProject(import.meta.resolve(url!));
		// 		await this.loadProject(info!.id, false);
		// 	} else {
		// 		await this.loadProject();
		// 	}
		// }
		await App.resetProject(projectInfo.id);
		this.requestUpdate();
		this.onChange.trigger();
	}
}