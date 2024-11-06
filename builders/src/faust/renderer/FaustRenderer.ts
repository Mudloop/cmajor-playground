import { css, LitElement, PropertyValues, unsafeCSS } from "lit";
import { customElement } from "lit/decorators";
import { FaustDspMeta, FaustMonoDspGenerator } from "@grame/faustwasm";
import { base64ToBytes } from "@cmajor-playground/utilities";
import { FaustUI } from "./faust-ui/index.js";
import styles from './faust-ui/index.css' with {type: 'text'}
import { BuildRenderer } from "../../cmaj/index.js";

@customElement('faust-renderer') export class FaustRenderer extends LitElement implements BuildRenderer {
	static styles = css`
		:host {
			display: block;
			width: 100%;
			height: 100%;
			overflow: hidden;
			position: relative;
		}
		:host>div {
			margin: 0;
			position: absolute;
			overflow: auto;
			display: flex;
			flex-direction: column;
			width: 100%;
			height: 100%;
		}
		${unsafeCSS(styles)}
	`;
	root?: HTMLDivElement;
	// ctx: AudioContext = new AudioContext({ latencyHint: 0.00001 });
	constructor(public meta: FaustDspMeta, public wasm: Uint8Array | string) { super(); }
	init = async (ctx: AudioContext) => {
		ctx.destination.channelInterpretation = "discrete";
		ctx.suspend();
		this.wasm = base64ToBytes(this.wasm);
		const module = new WebAssembly.Module(this.wasm);
		const json = JSON.stringify(this.meta);
		const generator = new FaustMonoDspGenerator();
		const factory = { module, code: this.wasm, json, soundfiles: {} };
		const faustNode = (await generator.createNode(ctx, this.meta.name, factory, true, 512))!;
		const root = document.createElement("div");
		this.root = root;
		this.shadowRoot!.appendChild(root);
		const faustUI = new FaustUI({
			ui: faustNode.getUI(),
			root: root,
			listenWindowMessage: false,
			listenWindowResize: true,
		});
		this.root.style.transform = `scale(${localStorage.getItem('zoom') ?? 100}%)`;
		this.root.style.transition = `all .25s ease`;
		faustUI.paramChangeByUI = faustNode.setParamValue.bind(faustNode);
		faustNode.setOutputParamHandler(faustUI.paramChangeByDSP.bind(faustUI));
		root.style.minWidth = `${faustUI.minWidth}px`;
		root.style.minHeight = `${faustUI.minHeight}px`;
		faustNode.connect(ctx.destination);
		
	};
	updated() {
		if (this.root) this.root.style.transform = `scale(${localStorage.getItem('zoom') ?? 100}%)`;
	}
}