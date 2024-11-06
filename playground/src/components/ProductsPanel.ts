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
	static styles = css`
		${COMMON_STYLES}
		:host {
			width: 100%;
			height: 100%;
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
			filter: brightness(0.7);
		}
		.muted iframe {
			opacity: .7;
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
			opacity: .1;
			background-size: var(--gradient-size) var(--gradient-size);
		}
		header {
			display: flex;
			flex-direction: column;
			gap: 4px;
		}
		header>* {width:100%;}
		header>:first-child {
			justify-content: space-between;
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
			background: #191b1b;
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
		button span {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		
		button.on {
			opacity: 1;
		}
		select { flex: 1; }
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
	protected updated(_changedProperties: PropertyValues): void {
		const productSelect = this.shadowRoot!.querySelector('select#product') as HTMLSelectElement;
		const product = this.products.find(product => product.path == productSelect.value);
		if (product != this.selectedProduct) {
			this.selectedProduct = product;
			ContextManager.reset();
			this.url = this.selectedProduct ? `./$${this.buildManager.project.volume.id}$${this.selectedProduct.id}/` : '';
			this.requestUpdate();
		}
	}
	render = () => html`
		<div class="container">
			<header  @change=${() => this.requestUpdate()}>
				<div>
					<select class="${this.products.length < 2 ? 'hiddenn' : ''}" id="product">${this.products.map((product) => html`<option value=${product.path} ?selected=${product.path === this.selectedProduct?.path}>${product.path.split('/').at(-1)?.replace('.cmajorpatch', '')}</option>`)}</select>
					<!--select>
						${Array.from(' '.repeat(20)).map((_, i) => html`<option>${i * 5 + 5}%</option>`)}
					</select-->
					<div class="audio-player">
						<select>${audioFiles.map((file) => html`<option value=${file} ?selected=${file === this.selectedAudioFile}>${file.split('/').at(-1)}</option>`)}</select>
						<ui-icon icon="player-play"></ui-icon>
						<div class="dropzone">Drop audio file here</div>
					</div>
					${false && !this.selectedProduct?.ready ? html`<ui-loader size="30"></ui-loader>` : ''}
				</div>
				<section>
					<h4 style="justify-content:start;gap:4px;padding-left:2px;"><ui-icon icon="tabler-chevron-right" style="flex-grow:0; flex-shrink:0;"></ui-icon> <span>Input Config (TODO)</span></h4>
				</section>
				
				
			</header>
			
			<main class="${ContextManager.muted ? 'muted' : ''}" >
				${this.selectedProduct?.ready ? keyed(this.selectedProduct.hash, html`
					<iframe @load=${(e: Event) => this.iframeLoaded(e.target as HTMLIFrameElement)} src="${this.url}">
				</iframe>`) :
				html`<ui-loader></ui-loader>`}
			</main>
		</div>
	`;
	async iframeLoaded(el: HTMLIFrameElement) {
		el.contentDocument?.addEventListener('pointerdown', () => ContextManager.userClicked(), { once: true });
		const init = (el.contentWindow as any).init;
		await init(this.selectedProduct, ContextManager, this.selectedProduct?.id);
	}
}