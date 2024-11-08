import { LitElement, css } from "lit";
import { customElement } from "lit/decorators";
import PianoKeyboard from './cmaj_api/cmaj-piano-keyboard.js';
import { Manifest } from "../types.js";
import * as helpers from './cmaj_api/cmaj-audio-worklet-helper.js'
import { createPatchViewHolder } from './cmaj_api/cmaj-patch-view.js';
import { TaskManager } from "@cmajor-playground/utilities";
import { RendererBase } from "../index.js";
import { RendererOptions } from "../../core/types.js";
@customElement('cmaj-renderer') export class CmajRenderer extends LitElement implements RendererBase {

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
	constructor() {
		super();
		if (!window.customElements.get('cmaj-panel-piano-keyboard')) customElements.define('cmaj-panel-piano-keyboard', PianoKeyboard);
	}
	init = async (options: RendererOptions) => {
		const manifest = options.data.manifest as Manifest;
		const code = options.data.code as string;
		console.log({ code });
		const version = options.data.version as string;
		const connection = this.connection = new helpers.AudioWorkletPatchConnection(manifest);
		connection.addAllParameterListener(async () => {
			localStorage.setItem('state-' + options.rootFileId, JSON.stringify((await TaskManager.addTask(this, () => new Promise((resolve) => this.connection?.requestFullStoredState((state: any) => resolve(state)))))));
		})

		const CmajorClass = await new Function(`return (${code});`)();
		const inputEndpoints = CmajorClass.prototype.getInputEndpoints();
		const audioInputs = inputEndpoints.filter((endpoint: any) => endpoint.purpose == 'audio in')
		const inputNodes: AudioNode[] = audioInputs.map((endpoint: any) => options.addInput(endpoint.endpointID, endpoint.numAudioChannels)).flat();

		// const outputEndpoints = CmajorClass.prototype.getOutputEndpoints();
		const midiInputEndpointID = inputEndpoints.find((i: any) => i.purpose === 'midi in')?.endpointID;
		if (!midiInputEndpointID) {
			const label = document.createElement('label');
			label.textContent = 'Click to enable patch';
			this.shadowRoot!.appendChild(label);
			await new Promise((resolve) => document.addEventListener('pointerdown', resolve, { once: true }));
			label.remove();
		}
		connection.getCmajorVersion = () => version;
		await (connection.initialise({
			CmajorClass,
			audioContext: options.ctx,
			workletName: 'cmaj-worklet-processor',
			hostDescription: 'WebAudio',
			rootResourcePath: document.location.pathname
		}));
		if (inputNodes.length > 0) {
			const merger = options.ctx.createChannelMerger(inputNodes.length);
			inputNodes.forEach((node, i) => node.connect(merger, 0, i));
			merger.connect(connection.audioNode!);
		}
		const state = JSON.parse(localStorage.getItem('state-' + options.rootFileId) ?? 'null');
		if (state) this.connection.sendFullStoredState(state);
		const container = this.shadowRoot!.appendChild(document.createElement('div'));
		container.classList.add('container');
		const main = container.appendChild(document.createElement('main'));
		this.main = main;
		const footer = this.shadowRoot!.appendChild(document.createElement('footer'));
		this.shadowRoot!.append(footer);
		main!.appendChild((await createPatchViewHolder(connection)));
		if (manifest.view?.width && manifest.view?.height) {
			main.classList.add('sized');
			main.style.setProperty('--width', manifest.view.width + 'px');
			main.style.setProperty('--aspect-ratio', manifest.view.width + ' / ' + manifest.view.height);
			const observer: ResizeObserver = new ResizeObserver(() => this.resize(main, manifest.view!.width!, manifest.view!.height!));
			window.addEventListener('resize', () => this.resize(main, manifest.view!.width!, manifest.view!.height!));
			observer.observe(main);
		} else {
			document.body.parentElement!.style.zoom = '80%'
		}
		if (midiInputEndpointID && !options.hideKeyboard) {
			const keyboard = new PianoKeyboard();
			keyboard.attachToPatchConnection(connection, midiInputEndpointID);
			keyboard.style.display = 'flex';
			footer.appendChild(keyboard);
		}
		connection.connectDefaultAudioAndMIDI(options.ctx);


	}
	resize(main: HTMLElement, width: number, height: number): any {
		const rect = main.parentElement!.getBoundingClientRect();
		const scale = Math.min(rect.width / width, rect.height / height);
		main.style.setProperty('--scale', scale.toString());
		main.style.setProperty('--left', (rect.width - width * scale + 8) / 2 + 'px');
		main.style.setProperty('--top', (rect.height - height * scale + 8) / 2 + 'px');
	}

}