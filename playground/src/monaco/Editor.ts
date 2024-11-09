import monaco from '@cmajor-playground/bunaco';
import { EditorFile } from '../state';

export class Editor {


	monaco!: monaco.editor.IStandaloneCodeEditor;
	container: HTMLDivElement;
	constructor(public file: EditorFile, public model: monaco.editor.ITextModel) {
		this.container = document.createElement('div');
		this.container.style.width = '100%';
		this.container.style.height = '100%';
		this.container.style.display = 'none';
		(document.getElementById('editor')!).append(this.container);
		this.monaco = monaco.editor.create(this.container, {
			model,
			theme: 'vs-dark',
			fontSize: 10.5,
			tabSize: 4,
			insertSpaces: false,
			useTabStops: true
		});
		this.monaco.onDidChangeModelContent(() => this.file.setVersion(this.model.getAlternativeVersionId()));
		window.addEventListener('resize', () => this.checkSize());
		this.monaco.getContainerDomNode().addEventListener('keydown', e => this.keydownHandler(e));
	}
	active: boolean = false;
	toggle(active: boolean) {
		if (this.active == active) return;
		this.active = active;
		this.container.style.display = active ? 'flex' : 'none';
		this.monaco.layout();
		setTimeout(() => this.monaco.layout(), 1);
	}
	private checkSize(): void {
		const size = document.body.getBoundingClientRect();
		this.monaco?.updateOptions({ minimap: { enabled: size.width > 900 } });
		this.monaco?.layout();
	}
	private keydownHandler = async (e: KeyboardEvent) => {
		if (e.key !== 's' || !(e.ctrlKey || e.metaKey)) return;
		e.preventDefault();
		e.stopPropagation();
		this.file.save(this.model.getValue(), this.model.getAlternativeVersionId());
	}

	dispose() {
		this.monaco?.dispose();
		this.container.remove();
	}
}