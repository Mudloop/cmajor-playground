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
		}
		main {
			flex: 1;
			position: relative;
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
		// console.log(code);
	}
	init = async (contextManager: typeof ContextManager) => {
		const ctx = contextManager.newContext;

		const connection = this.connection = new helpers.AudioWorkletPatchConnection(this.manifest);
		connection.addAllParameterListener(async () => {
			const state = await TaskManager.addTask(this, () => new Promise((resolve) => this.connection?.requestFullStoredState((state: any) => resolve(state))))
			localStorage.setItem('state-' + this.fileId, JSON.stringify(state));
		})


		connection.getCmajorVersion = () => this.version;
		await (connection.initialise({
			CmajorClass: await new Function(`return (${this.code});`)(),
			audioContext: ctx,
			workletName: 'cmaj-worklet-processor',
			hostDescription: 'WebAudio',
			rootResourcePath: document.location.pathname
		}));

		const state = JSON.parse(localStorage.getItem('state-' + this.fileId) ?? 'null');
		if (state) this.connection.sendFullStoredState(state);
		const main = this.shadowRoot!.appendChild(document.createElement('main'));
		// main.style.transform = `scale(${localStorage.getItem('zoom') ?? 100}%)`;
		// main.style.zoom = `65%`;
		// main.style.transition = `all .25s ease`;
		this.main = main;
		const footer = this.shadowRoot!.appendChild(document.createElement('footer'));
		this.shadowRoot!.append(footer);
		main!.appendChild((await createPatchViewHolder(connection)));
		const midiInputEndpointID = this.getMIDIInputEndpointID(connection);
		if (midiInputEndpointID) {
			const keyboard = new PianoKeyboard();
			keyboard.attachToPatchConnection(connection, midiInputEndpointID);
			keyboard.style.display = 'flex';
			footer.appendChild(keyboard);
		}
		await contextManager.activateContext();
		connection.connectDefaultAudioAndMIDI(ctx);
		// document.addEventListener('pointerdown', () => {
		// 	ctx.resume();
		// 	connection.connectDefaultAudioAndMIDI(ctx);
		// }, { once: true });




	}
	updated() {
		if (this.main) this.main.style.transform = `scale(${localStorage.getItem('zoom') ?? 100}%)`;
	}
	getMIDIInputEndpointID = (connection: helpers.AudioWorkletPatchConnection) => connection.inputEndpoints.find((i: any) => i.purpose === 'midi in')?.endpointID
}