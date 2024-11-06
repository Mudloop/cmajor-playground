import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators";
import { COMMON_STYLES } from "./common-styles";
import { FileType } from "../state/Types";
import { AsyncDirective, directive } from "lit/async-directive";
import { MagicDir, MagicFSEntry, MagicFile, isBinary, sanitizePath } from "@cmajor-playground/utilities";
import { Modals } from "./Modals";
import { Playground } from "./Playground";
import { mtype } from "../mtype";
import { keyed } from "lit/directives/keyed";

const directory = directive(class extends AsyncDirective {
	render = (dir: MagicDir, mapper: (node: MagicFSEntry) => void, cache: Map<string, any>) => {
		if (Array.isArray(dir.children)) {
			const val = dir.children.map(mapper);
			// cache.set(dir.path, val);
			return val;
		}
		Promise.resolve(dir.children).then((result) => {
			const val = result.map(mapper);
			// cache.set(dir.path, val);
			return this.setValue(val);
		}).catch(e => {
			console.error(e);
		});
		if (cache.has(dir.path)) {
			return cache.get(dir.path);
		}
		return html`<ui-loader></ui-loader>`;
	};
});
@customElement('cmaj-explorer') export class Explorer extends LitElement {



	@property({ type: Object }) playground!: Playground;
	static styles = css`
		${COMMON_STYLES}
		:host {
			display: flex;
			flex-direction: column;
			flex: 1;
			width: 100%;
			height: 100%;
			position: relative;
			background-color: #202223;
		}
		section {
			
			flex: 1;
			display: flex;
			flex-direction: column;
			position: relative;
		}
		section > ul {
			box-shadow: inset 0 0 50px #00000022, inset 0 0 8px 1px #00000088;
			border-radius: 4px;
			padding: 0;
			background-color: #33333366;
			flex: 1;
			position: absolute;
			top: 4px;
			width: calc(100% - 8px);
			left: 4px;
			max-height: calc(100% - 8px);

			overflow-y: auto;
		}
		
		ul {
			list-style: none;
			margin: 0;
			padding-left: 18px;
		}
		header {
			display: flex;
			align-items: center;
			padding: 5px;
			gap: 5px;
			cursor: pointer;
		}
		label {
			text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
			pointer-events: none;
			flex: 1;
			opacity: 0.7;
			color: white;
		}
		.tools {
			display: flex;
			gap: 0px;
		}
		.tools ui-icon {
			position: relative;
			opacity: 0;
		}
		.close {
			transform:scale(.75);
		}
		header:hover .tools ui-icon {
			opacity: .5;
			transition: all 0.2s ease;
		}
		li:hover .tools ui-icon:hover {
			opacity: 1;
		}
		li header:has(.close:hover) {
			background-color: #713525d9 !important;
			outline: 1px solid red;
			outline-offset: -1px;
			color: white;
		}
		nav {
			display: flex;
			gap: 4px;
		}
		nav>* {
			flex-shrink: 0;
			cursor: pointer;
		}
		header:hover {
			background-color: #444;
		}
		.selected>header {
			background-color: rgba(226, 180, 97, 0.15);
		}
		.selected>header>label {
			opacity: 0.8;
		}
		.selected>header:hover {
			background-color: rgba(226, 180, 97, 0.25);
		}
		.highlighted>header {
			box-shadow: inset 0 0 50px #ffffff22, inset 0 0 8px 1px #ffffff44;
			background-color: rgba(226, 180, 97, 0.267) !important;
			outline: 1px solid rgba(226, 180, 97, 0.29);
			outline-offset: -1px;
			border-radius: 2px;
		}
		.highlighted>header>label {
			opacity: 1 !important;
		}
		.target {
			outline: 1px dashed #e2b461;
			outline-offset: -1px;
			background-color: rgba(226, 180, 97, 0.1);
		}
		.toggle {
			transition: transform 0.2s;
		}
		.toggle:hover {
			color: white;
		}
		.expanded .toggle {
			transform: rotate(90deg);
		}
		.toggle:after {
			content: '';
			position: absolute;
			inset: -4px;
			background-color: transparent;
		}
	`;
	expanded: Set<string> = new Set();
	selection?: Set<string> = new Set();
	highlighted?: string;
	dragging?: string;
	target?: string;
	timeout: any;
	cache = new Map<string, any>()
	constructor() {
		super();
		this.addEventListener('dragover', (e: DragEvent) => this.dragOver(e, ''));
		this.addEventListener('dragleave', () => this.dragLeave(''));
	}
	render = () => html`
		<h4>
			<span class="ellipsis">Files</span>
			<nav>
				<ui-icon slot="trigger" icon="tabler-download" currentStroke @click=${() => this.download()}></ui-icon>
				<ui-icon slot="trigger" icon="tabler-folder-plus" currentStroke @click=${() => this.add(FileType.Dir)}></ui-icon>
				<ui-icon slot="trigger" icon="tabler-file-plus" currentStroke @click=${() => this.add(FileType.File)}></ui-icon>
			</nav>
		</h4>
		<section><ul class="${this.target == '' ? 'target' : ''}">${directory(this.playground.project!.fs.root, this.renderNode, this.cache)}</ul></section>
	`;
	protected firstUpdated(_changedProperties: PropertyValues): void {
		this.playground.onChange.add(async () => {
			return this.requestUpdate();
		});
		this.playground.project!.onFilesChange.add(async () => {
			return this.requestUpdate();
		});
	}
	async select(node: MagicFSEntry, e?: PointerEvent) {
		if (e && e?.button !== 0) return;
		this.highlighted = node.id;
		if (!e?.shiftKey && !e?.metaKey) this.selection?.clear();
		this.selection?.add(node.id);
		if (e?.shiftKey) {
			// const files = await this.playground.project!.getAllFiles();
			// let start = files.findIndex(file => file.id == node.id);
			// let end = files.findIndex(file => file.id == node.id);
			// for (let i = 0; i < files.length; i++) {
			// 	const file = files[i];
			// 	if (this.selected?.has(file.id)) {
			// 		start = Math.min(start, i);
			// 		end = Math.max(end, i);
			// 	}
			// }
			// for (let i = start; i <= end; i++) {
			// 	this.selected?.add(files[i].id);
			// }
		}
		if (!e?.shiftKey && !e?.metaKey && node.isFile) {
			await this.playground.project!.openFile(node.id);
		}
		this.requestUpdate();
	}
	toggle(id: string, e?: Event, forceOpen?: boolean) {
		if (this.expanded.has(id) && !forceOpen) {
			this.expanded.delete(id);
		} else {
			this.expanded.add(id);
		}
		this.requestUpdate();
		e?.stopPropagation();
		e?.preventDefault();
	}
	startDrag = (e: DragEvent, path: string) => {
		this.dragging = path;
		e.stopPropagation();
	};
	endDrag() {
		if (this.dragging && this.target !== undefined) {
			this.playground.project!.moveFile(this.dragging, this.target);
		}
		this.dragging = undefined;
		this.target = undefined;
		this.requestUpdate();
	}
	dragOver(e: DragEvent, dest: string, id?: string) {
		if (this.target !== undefined) e.preventDefault();
		if (this.target?.startsWith(dest)) return;
		if (this.dragging && dest.startsWith(this.dragging ?? '')) return;
		if (!this.dragging && !e.dataTransfer?.types.includes('Files')) return;
		e.preventDefault();
		if (this.target == dest) return;
		clearTimeout(this.timeout);
		if (id) {
			this.timeout = setTimeout(() => {
				this.expanded.add(id);
				this.requestUpdate();
			}, 300);
		}
		this.target = dest;
		this.requestUpdate();
	}
	dragLeave(dest: string) {
		if (this.target == dest) {
			this.target = undefined;
			this.requestUpdate();
			clearTimeout(this.timeout);
		}
	}
	drop = async (e: DragEvent) => {
		if (this.dragging) return;
		if (!e.dataTransfer?.items) return;
		const target = this.target;
		delete this.target;
		delete this.dragging;
		e.preventDefault();
		this.requestUpdate();
		const items = [...e.dataTransfer?.items ?? []].filter(item => item.kind == 'file' && item.webkitGetAsEntry).map(item => item.webkitGetAsEntry?.());
		const traverse = async (entry: FileSystemEntry, path: string) => {
			if (((path = sanitizePath(path)).split('/')).some(part => part.startsWith('.'))) return;
			const targetPath = sanitizePath(target + '/' + path);
			if (entry.isFile) {
				const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
				const reader = new FileReader();
				const mime = mtype(file.name);
				const binary = isBinary(mime);
				await new Promise((resolve, reject) => {
					reader.onload = resolve;
					reader.onerror = reject;
					if (binary) reader.readAsArrayBuffer(file);
					else reader.readAsText(file);
				});

				await this.playground.project!.volume.writeFile(targetPath, typeof reader.result == 'string' ? reader.result : new Uint8Array(reader.result as ArrayBuffer));
			} else {
				await this.playground.project!.volume.mkdir(targetPath);
				const dir = await new Promise<FileSystemEntry[]>((resolve, reject) => (entry as FileSystemDirectoryEntry).createReader().readEntries(resolve, reject));
				for (const entry of dir) {
					await traverse(entry, path + '/' + entry.name);
				}
			}
		}
		for (const entry of items) {
			if (!entry) continue;
			await traverse(entry, entry.name);
		}

	}
	getClasses = (node: MagicFSEntry) => [
		node.isDir ? 'dir' : 'file',
		this.selection?.has(node.id) ? 'selected' : '',
		this.highlighted == node.id ? 'highlighted' : '',
		this.target == node.path ? 'target' : ''
	].join(' ')
	renderNode: any = (node: MagicFSEntry) => html`
		<li
			class="${this.getClasses(node)}"
			draggable="true"
			@dragstart=${(e: DragEvent) => this.startDrag(e, node.path)}
			@dragend=${() => this.endDrag()}
			@drop=${(e: DragEvent) => { this.drop(e); }}
			@dragover=${node.isDir ? (e: DragEvent) => this.dragOver(e, node.path, node.id) : undefined}
			@dragleave=${node.isDir ? () => this.dragLeave(node.path) : undefined}
		>${node.isDir ? this.renderDir(node as MagicDir, this.expanded.has(node.id)) : this.renderFile(node as MagicFile)}</li>
	`;
	renderFile = (file: MagicFile) => html`
		<header @pointerdown=${(e: PointerEvent) => this.select(file, e)}>
			<ui-file-icon .path=${file.name} width="16" height="16"></ui-file-icon>
			<label>${file.name}</label>
			<div class="tools">
				<ui-icon currentStroke icon="pencil" @click=${(e: Event) => this.rename(file, e)}></ui-icon>
				<ui-icon class="close" currentColors icon="close" @pointerdown=${(e: Event) => this.delete(file, e)}></ui-icon>
			</div>
		</header>
	`;
	renderDir = (dir: MagicDir, expanded: boolean) => html`
		<header @pointerup=${(e: PointerEvent) => { this.toggle(dir.id, e, true); this.select(dir, e); }} class="${expanded ? 'expanded' : ''}">
			<ui-icon currentColors @pointerup=${(e: Event) => this.toggle(dir.id, e)} class="toggle" icon="tabler-chevron-right"></ui-icon>
			<label>${dir.name}</label>
			<div class="tools">
				<ui-icon currentStroke icon="pencil" @click=${(e: Event) => this.rename(dir, e)}></ui-icon>
				<ui-icon class="close" currentColors icon="close" @pointerup=${(e: Event) => this.delete(dir, e)}></ui-icon>
			</div>
		</header>
		${expanded ? html`<ul>${directory(dir, this.renderNode, this.cache)}</ul>` : ''}
	`;
	async rename(file: MagicFSEntry, e: Event) {
		e.stopPropagation();
		const name = await Modals.prompt('Enter name', `Enter a new name for the new ${file.isDir ? 'directory' : 'file'}`, file.name);
		if (!name) return;
		await file.rename(sanitizePath(file.path + '/../' + name));
		this.requestUpdate();
	}
	async delete(file: MagicFSEntry, e: Event) {
		e.stopPropagation();
		if (!await Modals.confirm('Delete project?', `Are you sure you want to remove '${file.name}'?`)) return;
		await file.unlink();
	}

	async add(type: FileType) {
		const name = await Modals.prompt('Enter name', `Enter a name for the new ${type == FileType.Dir ? 'directory' : 'file'}`);
		if (!name) return;
		let dir: MagicFSEntry | undefined = await this.playground.project!.fs.getById(this.highlighted) ?? this.playground.project!.fs.root;
		if (dir?.isFile) dir = await dir.parent;
		try {
			const mime = mtype(name);
			const binary = isBinary(mime);
			const entry = type == FileType.Dir ? await (dir as MagicDir).mkdir(name) : await (dir as MagicDir).addFile(name, binary ? new Uint8Array() : '');
			if (!entry) throw new Error('Failed to create file');
			this.expanded.add(dir!.id);
			this.select(entry);
			this.requestUpdate();
		} catch (e: any) {
			console.error(e);
			Modals.alert(e.message);
		}
	}
	download = () => this.playground.project!.download();
}