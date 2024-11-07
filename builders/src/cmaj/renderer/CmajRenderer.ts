import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators";
import PianoKeyboard from './cmaj_api/cmaj-piano-keyboard.js';
import { Manifest } from "../types.js";
import * as helpers from './cmaj_api/cmaj-audio-worklet-helper.js'
import { createPatchViewHolder } from './cmaj_api/cmaj-patch-view.js';
import { ContextManager, TaskManager } from "@cmajor-playground/utilities";
import { BuildRenderer } from "../index.js";
@customElement('cmaj-renderer') export class CmajRenderer extends LitElement implements BuildRenderer {

	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			width: 100%;
			height: 100%;
			--width: 1143px;
			--aspect-ratio: 1143 / 537;
			--scale: 1;
			--left: 0;
			--top: 0;
			gap: 4px;
			padding: 4px;
		}
		:host>label {
			color: white;
			font-size: 16px;
			text-align: center;
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			opacity: 0.75;
		}
		main {
			flex: 1;
			position: relative;
		}
		.container {
			flex: 1;
			display: flex;
		}
		main.sized {
			width: var(--width);
			position: absolute;
			object-fit: contain;
			margin-left: auto;
			margin-right: auto;
			margin-top: auto;
			margin-bottom: auto;
			aspect-ratio: var(--aspect-ratio);
			transform: scale(var(--scale));
			flex: 0;
			transform-origin: 0 0;
			left: var(--left);
			top: var(--top);
		}
		main>* {
			position: absolute !important;
			inset: 0;
		}
		footer {
			background-color: #191b1b;
			display: flex;
			width: 100%;
			justify-content: center;
			z-index: 1000;
		}
		cmaj-panel-piano-keyboard {
			height: 32px;
			position: sticky;
			bottom: 0;
			flex-shrink: 0;
			justify-content: center;
			align-items: center;
			max-width: 100% !important;
		}
	`;
	connection?: helpers.AudioWorkletPatchConnection;
	main?: HTMLElement;
	constructor(public manifest: Manifest, public version: string, public code: string, public fileId: string) {
		super();
		if (!window.customElements.get('cmaj-panel-piano-keyboard')) customElements.define('cmaj-panel-piano-keyboard', PianoKeyboard);
		console.log({ code });
	}
	init = async (contextManager: typeof ContextManager) => {
		const ctx = contextManager.newContext;
		const connection = this.connection = new helpers.AudioWorkletPatchConnection(this.manifest);
		connection.addAllParameterListener(async () => {
			const state = await TaskManager.addTask(this, () => new Promise((resolve) => this.connection?.requestFullStoredState((state: any) => resolve(state))))
			localStorage.setItem('state-' + this.fileId, JSON.stringify(state));
		})

		const CmajorClass = await new Function(`return (${this.code});`)();
		const midiInputEndpointID = CmajorClass.prototype.getInputEndpoints().find((i: any) => i.purpose === 'midi in')?.endpointID;
		if (!midiInputEndpointID) {
			const label = document.createElement('label');
			label.textContent = 'Click to enable patch';
			this.shadowRoot!.appendChild(label);
			await new Promise((resolve) => document.addEventListener('pointerdown', resolve, { once: true }));
			label.remove();
		}
		connection.getCmajorVersion = () => this.version;
		await (connection.initialise({
			CmajorClass,
			audioContext: ctx,
			workletName: 'cmaj-worklet-processor',
			hostDescription: 'WebAudio',
			rootResourcePath: document.location.pathname
		}));

		const state = JSON.parse(localStorage.getItem('state-' + this.fileId) ?? 'null');
		if (state) this.connection.sendFullStoredState(state);
		const container = this.shadowRoot!.appendChild(document.createElement('div'));
		container.classList.add('container');
		const main = container.appendChild(document.createElement('main'));
		this.main = main;
		const footer = this.shadowRoot!.appendChild(document.createElement('footer'));
		this.shadowRoot!.append(footer);
		main!.appendChild((await createPatchViewHolder(connection)));
		if (this.manifest.view?.width && this.manifest.view?.height) {
			main.classList.add('sized');
			main.style.setProperty('--width', this.manifest.view.width + 'px');
			main.style.setProperty('--aspect-ratio', this.manifest.view.width + ' / ' + this.manifest.view.height);
			const observer: ResizeObserver = new ResizeObserver(() => this.resize(main, this.manifest.view!.width!, this.manifest.view!.height!));
			window.addEventListener('resize', () => this.resize(main, this.manifest.view!.width!, this.manifest.view!.height!));
			observer.observe(main);
		} else {
			document.body.parentElement!.style.zoom = '85%'
		}
		if (midiInputEndpointID) {
			const keyboard = new PianoKeyboard();
			keyboard.attachToPatchConnection(connection, midiInputEndpointID);
			keyboard.style.display = 'flex';
			footer.appendChild(keyboard);
		}
		await contextManager.activateContext();
		connection.connectDefaultAudioAndMIDI(ctx);

	}
	resize(main: HTMLElement, width: number, height: number): any {
		const rect = main.parentElement!.getBoundingClientRect();
		const scale = Math.min(rect.width / width, rect.height / height);
		main.style.setProperty('--scale', scale.toString());
		main.style.setProperty('--left', (rect.width - width * scale + 8) / 2 + 'px');
		main.style.setProperty('--top', (rect.height - height * scale + 8) / 2 + 'px');
	}

}