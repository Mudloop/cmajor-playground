import { customElement, property } from "lit/decorators";
import { css, html, LitElement, PropertyValues } from "lit";
import { COMMON_STYLES } from "./common-styles";
import { keyed } from "lit/directives/keyed";
import naturalSort from "natural-sort";
import { BuildManager } from "../state";
import { audioFiles } from "../state/audioFiles";
import { BuildInfo } from "@cmajor-playground/builders";
import { ContextManager } from "@cmajor-playground/utilities";

@customElement('cmaj-products') export class ProductsPanel extends LitElement {
	@property({ type: Object }) buildManager!: BuildManager;
	@property({ type: String, attribute: true }) position = 'right';
	@property({ type: Boolean }) hideKeyboard = false;
	static styles = css`
		${COMMON_STYLES}
		:host {
			width: 100%;
			height: 100%;
		}
		header>* {
			width: unset;
		}
		.container {
			display: flex;
			flex-direction: column;
			overflow: auto;
			width: 100%;
			gap: 6px;
			background-color: #33333366;
			padding: 6px;
		}
		:host([position=bottom]) .container {
			flex-direction: row-reverse;
		}
		iframe {
			width: 100%;
			flex: 1;
			border: 0;
			border-radius: 10px;
		}
		.muted {
			position: relative;
			filter: brightness(0.4) contrast(0.88) saturate(0.8);
		}
		.muted iframe {
			opacity: .9;
		}
		.muted::after {
			pointer-events: none;
			content: '';
			position: absolute;
			inset: 0;
			--gradient-color-1: transparent;
			--gradient-color-2: #9a9a9a;
			--gradient-size: 10px;

			background-image: linear-gradient(45deg, var(--gradient-color-1) 25%, var(--gradient-color-2) 25%, var(--gradient-color-2) 50%, var(--gradient-color-1) 50%, var(--gradient-color-1) 75%, var(--gradient-color-2) 75%, var(--gradient-color-2) 100%);
			opacity: .08;
			background-size: var(--gradient-size) var(--gradient-size);
		}
		header {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}
		header>:first-child {
			/*justify-content: space-between;*/
			display: flex;
			align-items: center;
			flex-direction: row;
			gap: 4px;
		}
		/*:host([position=bottom]) header>:first-child {
			flex-direction: column;
			align-items: stretch;
			justify-content: start;
			min-width:120px;
			gap: 6px;
		}*/
		:host([position=bottom]) header>* {
			height: unset;
			width: 100%;
		}
		header ui-loader {
			width: unset;
		}
		main {
			flex: 1;
			display: flex;
			background-color: #222424;
			box-shadow: inset 0 0 50px #00000054, inset 0 0 8px 2px #00000020;
			border-radius: 10px;
		}
		button {
			cursor: pointer;
			border: none;
			color: inherit;
			display: flex;
			gap: 6px;
			align-items: center;
			padding: 0;
			border: none;
			border-radius: 4px;
			background-color: transparent;
			color: inherit;
			-webkit-appearance: none;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
			font-size: 12px;
			outline: none !important;
			opacity: .55;
		}
		ui-icon {
			cursor: pointer;
		}
		button span {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		
		button.on {
			opacity: 1;
		}
		select { flex: 1; }
		select:disabled {
			opacity: 1;
			background: unset !important;
			text-align: center;
			padding-right: 2px;
			padding-left: 12px;
			font-weight: 600;
			letter-spacing: 1px;
			text-transform: uppercase;
			font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
		}
		.audio-player {
			visibility: hidden;
			display: flex;
			display: none;
			gap: 4px;
			align-items: center;
		}
		:host([position=bottom]) .audio-player {
			flex-direction: column;
			align-items: stretch;
			gap: 6px;
		}
		.dropzone {
			border: 1px dashed #555;
			border-radius: 4px;
			padding: 6px 4px;
			flex: 1;
			text-align: center;
			cursor: pointer;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		h4 span {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		:host([position=bottom]) .audio-player {
			height: 100%;
		}
	`;
	selectedProduct?: BuildInfo;
	selectedAudioFile?: string;
	products: BuildInfo[] = [];
	url = '';
	connectedCallback(): void {
		super.connectedCallback();
		ContextManager.muteChanged.add(() => this.requestUpdate())
	}
	disconnectedCallback(): void {
		ContextManager.muteChanged.remove(() => this.requestUpdate())
	}
	protected firstUpdated(_changedProperties: PropertyValues): void {
		this.buildManager?.onChange.add(() => {
			this.products = Object.values(this.buildManager.builds).sort((a, b) => a.type == 'cmajor' && b.type != 'cmajor' ? -1 : naturalSort()(a.path, b.path));
			this.requestUpdate();
		});

	}
	prevHash: string = '';
	protected updated(_changedProperties: PropertyValues): void {
		const productSelect = this.shadowRoot!.querySelector('select#product') as HTMLSelectElement;
		const product = this.products.find(product => product.path == productSelect.value);
		if ((product?.hash ?? '') != (this.prevHash ?? '')) {
			this.prevHash = product?.hash ?? '';
			this.selectedProduct = product;
			this.inputs.length = 0;
			ContextManager.reset();
			this.url = this.selectedProduct ? `./$${this.buildManager.project.volume.id}$${this.selectedProduct.id}/` : '';
			this.requestUpdate();
		}
	}
	render = () => html`
		<div part="container" class="container">
			<header part="header" @change=${() => this.requestUpdate()}>
				<div>
					<select ?disabled=${this.products.length < 2} id="product">${this.products.map((product) => html`<option value=${product.path} ?selected=${product.path === this.selectedProduct?.path}>${product.path.split('/').at(-1)?.replace('.cmajorpatch', '')}</option>`)}</select>
					<ui-icon @click=${() => { delete this.selectedProduct; this.prevHash = ''; this.requestUpdate(); }} icon="tabler-reload"></ui-icon>
				</div>
				<div style="display:flex; gap:4px; flex-wrap: wrap;">${this.inputs}</div>
			</header>
			
			<main class="${ContextManager.muted ? 'muted' : ''}" >
				${this.selectedProduct?.ready ? keyed(this.selectedProduct.hash, html`
					<iframe @load=${(e: Event) => this.iframeLoaded(e.target as HTMLIFrameElement)} src="${this.url}">
				</iframe>`) :
			html`<ui-loader></ui-loader>`}
			</main>
		</div>
	`;
	inputs: Input[] = [];
	async iframeLoaded(el: HTMLIFrameElement) {
		if (!ContextManager.userHasClicked) el.contentDocument?.addEventListener('pointerdown', () => ContextManager.userClicked(), { once: true });
		const ctx = ContextManager.newContext;
		const ret = await (el.contentWindow as any).init({
			type: this.selectedProduct?.type,
			data: this.selectedProduct?.build,
			rootFileId: this.selectedProduct?.id,
			hideKeyboard: this.hideKeyboard,
			ctx: ctx,
			addInput: (name: string, channels: number) => {
				const input = new Input(name, channels, ctx);
				this.inputs.push(input);
				this.requestUpdate();
				return input.nodes;
			}
		});
		this.requestUpdate();
		await ContextManager.activateContext();
	}
}
@customElement('cmaj-input') class Input extends LitElement {
	static styles = css`
		${COMMON_STYLES}
		:host {
			display: flex;
			flex-direction: row;
			--slider-bg: #4e4e4e;
			--slider-thumb: #757575;
			padding: 0px 10px;
			gap: 8px;
			border-radius: 4px;
		}
		header {
			text-transform: uppercase;
			font-size: 10px;
			
			font-weight: 600;
			letter-spacing: 2px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		main {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			gap: 4px;
		}
		select {
			flex: 1;
			min-width: 90px;
		}
		input[type=range] {
			-webkit-appearance: none;
			flex: 1;
			min-width: 90px;
			background: transparent;
		}
		
		input[type=range]:focus {
			outline: none;
		}
		
		input[type=range]::-webkit-slider-runnable-track {
			width: 100%;
			height: 8.4px;
			cursor: pointer;
			background: var(--slider-bg);
			border-radius: 50px;
			border: none;
		}
		
		input[type=range]::-webkit-slider-thumb {
			height: 12px;
			width: 12px;
			border-radius: 100%;
			background: var(--slider-thumb);
			cursor: pointer;
			-webkit-appearance: none;
			margin-top: -2px;
		}
		
		
	`;
	nodes: AudioNode[] = [];
	osc: OscillatorNode;
	internalNodes: AudioNode[] = [];
	@property({ type: String }) type: string = 'none';
	@property({ type: String }) oscType: OscillatorType = 'sine';
	@property({ type: Number }) oscFrequency: number = 220;
	constructor(public name: string, public channels: number, public ctx: AudioContext) {
		super();
		for (let i = 0; i < channels; i++) this.nodes.push(ctx.createGain());
		this.osc = ctx.createOscillator();
		this.osc.start();
		// this.osc.type
		this.internalNodes.push(this.osc);
	}

	protected updated(_changedProperties: PropertyValues): void {
		this.internalNodes.forEach(node => node.disconnect());
		console.log(this.type);
		switch (this.type) {
			case 'oscillator':
				this.nodes.forEach(node => this.osc.connect(node));
				this.osc.type = this.oscType;
				this.osc.frequency.value = this.oscFrequency;
				break;
		}
	}
	render = () => html`
		<header>${this.name}</header>
		<main>
			<select @change=${(e: any) => this.type = e.target.value}>
				<option value="node">None</option>
				<option value="oscillator">Oscillator</option>
				<option value="audio-file" disabled="">Audio File (TODO)</option>
			</select>
			${this.type == 'oscillator' ? html`
				<select @change=${(e: any) => this.oscType = e.target.value}>
					<option value="sine">Sine</option>
					<option value="sawtooth">Sawtooth</option>
					<option value="square">Square</option>
					<option value="triangle">Triangle</option>
				</select>
				<input type="range" min="0" max="2000" value="220" @input=${(e: any) => this.oscFrequency = parseFloat(e.target.value)}>
			`: ''}
		</main>

	`
}