import { customElement, property } from "lit/decorators";
import { css, html, LitElement, PropertyValues } from "lit";
import { COMMON_STYLES } from "./common-styles";
import { keyed } from "lit/directives/keyed";
import naturalSort from "natural-sort";
import { BuildManager } from "../state";
import { audioFiles } from "../state/audioFiles";
import { BuildInfo } from "@cmajor-playground/builders";
// let ctx = new AudioContext({ latencyHint: 0.00001 });
// ctx.suspend();
// (window as any).audioStarted = false;
// let iframeClicked = false;
// const startAudio = (e: Event, isIframe = false) => {
// 	if (isIframe) iframeClicked = true;
// 	if ((window as any).audioStarted) return;
// 	(window as any).audioStarted = true;
// 	if (iframeClicked && JSON.parse(localStorage.getItem('audioEnabled') ?? 'true')) {
// 		console.log('starting audio');
// 		ctx.resume();
// 	}
// 	// if (audioEnabled) ctx.resume();
// }
// (window as any).ctx = ctx;
// document.addEventListener('keydown', startAudio, { once: true });
// document.addEventListener('pointerdown', startAudio, { once: true });
// document.addEventListener('touchstart', startAudio, { once: true });
// window.focus();
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
	protected firstUpdated(_changedProperties: PropertyValues): void {
		this.buildManager?.onChange.add(() => {
			this.products = Object.values(this.buildManager.builds).sort((a, b) => a.type == 'cmajor' && b.type != 'cmajor' ? -1 : naturalSort()(a.path, b.path));
			return this.requestUpdate();
		});
		this.audioEnabled = JSON.parse(localStorage.getItem('audioEnabled') ?? 'true');

	}
	protected updated(_changedProperties: PropertyValues): void {
		const productSelect = this.shadowRoot!.querySelector('select#product') as HTMLSelectElement;
		const product = this.products.find(product => product.path == productSelect.value);
		if (product != this.selectedProduct) {
			this.selectedProduct = product;
			// this.url = this.selectedProduct ? `/$${this.buildManager.project.volume.id}$${this.selectedProduct.id}/?${this.selectedProduct?.hash}` : '';
			this.url = this.selectedProduct ? `./$${this.buildManager.project.volume.id}$${this.selectedProduct.id}/` : '';
			this.requestUpdate();
		}
	}
	toggleAudio(enabled: boolean) {
		this.audioEnabled = enabled;
		localStorage.setItem('audioEnabled', JSON.stringify(enabled));
		const iframe = this.shadowRoot!.querySelector('iframe');
		// if (!enabled) ctx.suspend();
		// else {
		// 	console.log('resume');;
		// 	ctx.resume();
		// }
	}
	@property({ type: Boolean }) audioEnabled = true;
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
					${this.audioEnabled ? html`
						<button class="on" @click=${() => this.toggleAudio(false)}>
							<ui-icon width="18" height="18" currentColors icon="unmuted"></ui-icon>
						</button>
					` : html`
						<button class="off" @click=${() => this.toggleAudio(true)}>
							<ui-icon width="18" height="18" currentColors icon="muted"></ui-icon>
						</button>
					`}
				</div>
				<section>
					<h4 style="justify-content:start;gap:4px;padding-left:2px;"><ui-icon icon="tabler-chevron-right" style="flex-grow:0; flex-shrink:0;"></ui-icon> <span>Input Config (TODO)</span></h4>
				</section>
				
				
			</header>
			
			<main>
				${this.selectedProduct?.ready ? keyed(this.selectedProduct.hash, html`<iframe @load=${(e: Event) => this.iframeLoaded(e.target as HTMLIFrameElement)} src="${this.url}"></iframe>`) : html`<ui-loader></ui-loader>`}
			</main>
		</div>
	`;
	async iframeLoaded(el: HTMLIFrameElement) {
		// if (!(window as any).audioStarted) el.contentDocument?.addEventListener('pointerdown', (e) => startAudio(e, true), { once: true });
		const init = (el.contentWindow as any).init;
		if ((window as any).audioStarted) {
			console.log('restarting audio');
			// ctx.close();
			// ctx = new AudioContext({ latencyHint: 0.00001 });
			// ctx.suspend();
		}
		await init(this.selectedProduct, null, this.selectedProduct?.id);
		// if ((window as any).audioStarted && iframeClicked && JSON.parse(localStorage.getItem('audioEnabled') ?? 'true')) {
		// 	ctx.resume();
		// }
	}
}