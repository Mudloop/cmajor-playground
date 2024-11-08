import { css, LitElement, unsafeCSS } from "lit";
import { customElement } from "lit/decorators";
import { FaustDspMeta, FaustMonoDspGenerator } from "@grame/faustwasm";
import { base64ToBytes } from "@cmajor-playground/utilities";
import { FaustUI } from "./faust-ui/index.js";
import styles from './faust-ui/index.css' with {type: 'text'}
import { RendererBase } from "../../cmaj/index.js";
import { RendererOptions } from "../../core/types.js";

@customElement('faust-renderer') export class FaustRenderer extends LitElement implements RendererBase {
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
	constructor() { super(); }
	init = async (options: RendererOptions) => {
		const meta = options.data.json as FaustDspMeta;
		options.ctx.destination.channelInterpretation = "discrete";
		const wasm = base64ToBytes(options.data.wasm);
		const module = new WebAssembly.Module(wasm);
		const json = JSON.stringify(meta);
		const generator = new FaustMonoDspGenerator();
		const factory = { module, json, soundfiles: {} };
		const faustNode = (await generator.createNode(options.ctx, meta.name, factory, true, 512))!;
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
		if (faustNode.channelCount * faustNode.numberOfInputs > 0) {
			const inputNodes: AudioNode[] = options.addInput('Input', faustNode.channelCount * faustNode.numberOfInputs);
			const merger = options.ctx.createChannelMerger(inputNodes.length);
			inputNodes.forEach((node, i) => node.connect(merger, 0, i));
			merger.connect(faustNode!);
		}
		
		root.style.minWidth = `${faustUI.minWidth}px`;
		root.style.minHeight = `${faustUI.minHeight}px`;
		faustNode.connect(options.ctx.destination);
	};
	updated() {
		if (this.root) this.root.style.transform = `scale(${localStorage.getItem('zoom') ?? 100}%)`;
	}
}