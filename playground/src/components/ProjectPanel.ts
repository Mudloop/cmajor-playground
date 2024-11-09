import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import { examples } from '../state/examples';
import { COMMON_STYLES } from './common-styles';
import { Playground } from './Playground';
import { ProjectInfo } from "../state/Types";
import { Modals } from "./Modals";
import JSZip from "jszip";
import { App } from "../state";

@customElement('cmaj-projects') export class ProjectPanel extends LitElement {

	@property({ type: Object }) playground!: Playground;
	static styles = css`
		${COMMON_STYLES}
		:host {
			flex-direction: column;
			background-color: #202223;
			height: min(200px, 30%);
		}
		
		ul {
			border-radius: 2px;
			background-color: #35363763;
			list-style: none;
			padding: 0;
			margin: 0;
			overflow-y: auto;
			height: 100%;
			
		}
		section {
			position: relative;
			height: 100%;
		}
		section ul {
			position: absolute;
			inset: 0;
		}
		li {
			padding: 4px 8px;
			cursor: pointer;
			display: flex;
			align-items: center;
		}

		li:hover {
			background-color: #444;
		}
		.selected {
			background-color: rgba(226, 180, 97, 0.267) !important;
			outline: 1px solid rgba(226, 180, 97, 0.29);
			outline-offset: -1px;
			border-radius: 2px;
		}
		label {
			flex: 1;
			text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
			pointer-events: none;
		}
		.selected label {
			opacity: 1;
			color:white;
		}
		.selected:hover {
			background-color: rgba(226, 180, 97, 0.3);
		}
		li>span {
			background-color: #d3cd9f;
			padding: 2px 6px;
			font-size: 7.5px;
			border-radius: 50px;
			margin-right: 4px;
			color: black;
			text-transform: uppercase;
			font-weight: 900;
			letter-spacing: .5px;
			display: flex;
			align-items: center;
		}
		li>span.modified {
			background-color: #e2b461;
		}
		.tools {
			display: flex;
			gap: 0px;
			width: 0;
			overflow: hidden;
		}
		li:hover .tools {
			width: fit-content;
			overflow: unset;
		}
		.tools ui-icon {
			position: relative;
			opacity: 0;
		}
		.close {
			transform:scale(.75);
		}
		li:has(.close:hover) {
			background-color: #713525d9 !important;
			outline: 1px solid red;
			outline-offset: -1px;
			color: white;
		}
		li:hover .tools ui-icon {
			opacity: .5;
			transition: all 0.2s ease;
		}
		li:hover .tools ui-icon:hover {
			opacity: 1;
			color: white;
		}
		nav {
			display: flex;
			align-items: center;
			gap: 4px;
		}
		ui-icon {
			position: relative;
		}
		ui-icon:after {
			content: '';
			position: absolute;
			inset: -4px;
			background-color: transparent;
		}
	`;
	render = () => {
		return html`
			
			<h4>
				<span class="ellipsis">Projects</span>
				<nav>
					<cmaj-examples .playground=${this.playground}></cmaj-examples>
					<ui-menu>
						<ui-icon slot="trigger" icon="plus" currentColors></ui-icon>
						
						<ul>
							<li @click=${() => this.newProject('default')}><ui-icon currentStroke icon="tabler-plus"></ui-icon> New Project</li>
							<li @click=${() => this.newProject('ui')}><ui-icon currentStroke icon="tabler-new-section"></ui-icon> New Project With Demo UI</li>
							<li @click=${() => this.importURL()}><ui-icon currentStroke icon="tabler-link"></ui-icon> Import From URL</li>
							<li><ui-icon currentStroke icon="tabler-upload"></ui-icon> Upload Files <label>(TODO)</label></li>
							<li @click=${() => this.downloadAll()}><ui-icon currentStroke icon="tabler-zip"></ui-icon> Export My Projects</li>
						</ul>
					</ui-menu>
				</nav>
				
			</h4>
			
			${this.projects?.length ?? 0 > 0 ? html`
				<section>
					<ul>
						${this.projects?.map(project => html`
							<li
								class="${project.id == this.playground.project?.info.id ? 'selected' : ''}"
								@click=${() => this.playground.loadProject(project.id)}
							>
								${this.isExample(project) ? html`<span class="${project.version > 0 ? 'modified' : ''}">Demo</span> ${project.version > 0 ? '• ' : ''}` : ''}
								<label>${project.name}</label>
								<div class="tools">
									${this.isExample(project) && project.version > 0 ? html`<ui-icon currentStroke icon="tabler-reload" @click=${(e: Event) => this.resetProject(project, e)}></ui-icon>`:''}
									<ui-icon currentStroke icon="tabler-download" @click=${(e: Event) => this.downloadProject(project, e)}></ui-icon>
									<ui-icon currentColors class="close" icon="close" @click=${(e: Event) => this.deleteProject(project, e)}></ui-icon>
								</div>
							</li>
						`)}
					</ul>
				</section>
			` : ''}
			
		`;
	};
	projects?: ProjectInfo[];
	private resetProject(project: ProjectInfo, e: Event) {
		this.playground.resetProject(project);
		e.stopPropagation();
	}

	protected firstUpdated(_changedProperties: PropertyValues): void {
		this.playground.onChange.add(() => this.requestUpdate());
	}
	prevProjects?: string;
	protected async updated(_changedProperties: PropertyValues) {
		super.updated(_changedProperties);
		this.projects = await App.listProjects();

		this.projects.sort((a, b) => this.isExample(a) ? 1 : -1);
		if (this.prevProjects != JSON.stringify(this.projects)) {
			this.prevProjects = JSON.stringify(this.projects);
			this.requestUpdate();
		}
	}
	isExample = (project: ProjectInfo) => Object.values(examples).map(url => import.meta.resolve(url)).includes(project.source?.identifier!)
	async newProject(template: string) {
		const name = await Modals.prompt('Enter name', 'Enter a name for the new project');
		if (name) {
			const project = await App.createProject(name, template);
			if (project) this.playground.loadProject(project.id);
		}
	}

	async deleteProject(project: ProjectInfo, e?: Event) {
		e?.preventDefault();
		e?.stopPropagation();
		if (project.version > 0 || !this.isExample(project)) {
			if (!await Modals.confirm('Delete project?', `Are you sure you want to remove the project '${project.name}'?`)) return;
		}
		await App.deleteProject(project.id);
		if (project.id == this.playground.project?.info.id) {
			this.playground.closeProject()
		}
	}
	async importURL() {
		const url = await Modals.prompt('Enter URL', 'Enter the URL of the project to import');
		if (!url) return
		const info = await App.importProject(url);
		if (!info) return;
		if (!await this.playground.loadProject(info?.id)) {

		}
	}
	async downloadProject(project: ProjectInfo, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		const volume = await App.vfs.getVolume(project.id);
		const zip = await volume.zipFolder('');
		if (project.id != this.playground.project?.info.id) volume.removeWatchers();
		const blob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = project.name + '.zip';
		a.click();
	}
	async downloadAll() {
		const projects = await App.listProjects();
		const zip = new JSZip();
		const usedNames = new Set<string>();
		for (const project of projects) {
			const volume = await App.vfs.getVolume(project.id);
			let name = project.name;
			let i = 1;
			while (usedNames.has(name)) name = project.name + ' (' + ++i + ')';
			usedNames.add(name);
			await volume.zipFolder('', zip, name);
			if (project.id != this.playground.project?.info.id) volume.removeWatchers();
		}
		const blob = await zip.generateAsync({ type: 'blob' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'Projects.zip';
		a.click();
	}

}