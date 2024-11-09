import { FileContents, MagicFile, Trigger } from "@cmajor-playground/utilities";

export class EditorFile {


	isDirty = false;
	storedContent?: FileContents;
	changeTrigger: Trigger = new Trigger();
	version: number = 1;
	savedVersion: number = 1;
	get useMonaco() { return !this.file.isBinary; }
	constructor(public file: MagicFile) {
		file.onChange.add(this.fileChanged);
		this.init();
	}
	async init() {
		this.storedContent = await this.file.content;
	}
	setVersion(v: number) {
		this.version = v;
		this.checkState();
	}
	private checkState = () => {
		const dirty = this.version != this.savedVersion;
		if (dirty == this.isDirty) return;
		this.isDirty = dirty;
		this.changeTrigger.trigger();
	}
	private fileChanged = async () => {
		// const content = await this.file.content;
		// if (this.storedContent != content) {
		// 	this.storedContent = content;
		// 	if (!this.isDirty) this.setEditorContent(content)
		// }
	}

	dispose(): void {
		this.changeTrigger.removeAll();
		this.file.onChange.remove(this.fileChanged);
	}
	save = async (content: string, version: number) => {
		await this.file.write(content)
		this.savedVersion = version;
		this.checkState();
	}

}