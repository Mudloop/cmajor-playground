import { FileContents, MagicFile, Trigger } from "@cmajor-playground/utilities";
import { LitElement, css } from "lit";
import { COMMON_STYLES } from "./common-styles";

export abstract class FileEditorBase extends LitElement {

	static styles = css`
		${COMMON_STYLES}
		:host {
			display: block;
			flex:1;
			height: 100%;
			width: 100%;
			border-top: none;
		}
	`;
	isDirty = false;
	storedContent?: FileContents;
	editorContent?: FileContents;
	constructor(public file: MagicFile) {
		super();
		file.onChange.add(this.fileChanged);
		// file.onDelete.add(this.fileDeleted);
		this.addEventListener('keydown', async (e: KeyboardEvent) => {
			await this.keydownHandler(e);
		});
	}
	changeTrigger: Trigger = new Trigger();
	private fileChanged = async () => {
		const content = await this.file.content;
		if (this.storedContent != content) {
			this.storedContent = content;
			if (!this.isDirty) {
				this.setEditorContent(content)
				this.onContentUpdate();
			}
		}
	}
	protected keydownHandler = async (e: KeyboardEvent) => {
		if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			await this.file.write(this.editorContent!);
			this.storedContent = this.editorContent;
			this.isDirty = false;
			this.changeTrigger.trigger();
		}
	}

	protected setEditorContent(content: FileContents) {
		this.editorContent = content;
		this.isDirty = this.storedContent != this.editorContent;
		this.changeTrigger.trigger();
	}
	async firstUpdated() {
		this.storedContent = await this.file.content;
		this.editorContent = this.storedContent;
		await this.onFirstContentLoad();
		this.requestUpdate();
	}
	protected abstract onFirstContentLoad(): any;
	protected abstract onContentUpdate(): any;
	abstract render(): ReturnType<LitElement["render"]>;
	abstract onDispose(): void;
	dispose(): void {
		this.changeTrigger.dispose();
		this.file.onChange.remove(this.fileChanged);
		// this.file.onDelete.remove(this.fileDeleted);
	}
}
