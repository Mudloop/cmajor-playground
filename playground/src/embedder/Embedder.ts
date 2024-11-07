import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators";
@customElement('cmaj-embedder') export class CmajEmbedder extends LitElement {
	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			width: 100%;
			height: 100%;
		}
		iframe {
			border: 0;
			
			flex: 1;
		}
		dialog:not([enlarged]) iframe {
			border-radius: 12px;
		}
		dialog:not([enlarged]) {
			position: relative;
		}
		dialog {
			margin: 0;
			padding: 0;
			background-color: transparent;
			border: none;
			outline: none !important;
			width: 100%;
			height: 100%;
			display: flex;
			max-width: 100%;
			max-height: 100%;
		}
	`;
	@property({ type: String }) demo?: string;
	@property({ type: Boolean, attribute: 'hide-project-panel' }) hideProjectPanel = true;
	@property({ type: Boolean, attribute: 'hide-keyboard' }) hideKeyboard = false;
	@property({ type: Boolean, attribute: 'preview-mode' }) previewMode = false;
	render = () => html`
		<dialog open>
			<iframe src="${new URL('../../', import.meta.url).href}./?hide-project-panel=${this.hideProjectPanel}${this.demo ? `&demo=${this.demo}` : ''}&hide-keyboard=${this.hideKeyboard}&preview-mode=${this.previewMode}"></iframe>
		</dialog>
	`;
	protected firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);
		const iframe = this.shadowRoot!.querySelector('iframe')!;
		const dialog = this.shadowRoot!.querySelector('dialog')!;
		iframe.contentWindow?.addEventListener('message', (e) => {
			switch (e.data.type) {
				case 'enlarge':
					if (dialog.hasAttribute('enlarged')) return;
					dialog.close();
					dialog.showModal();
					dialog.setAttribute('enlarged', '');
					setTimeout(() => {
						dialog.onclose = () => {
							iframe.contentWindow?.postMessage({ type: 'shrunken' }, '*');
							dialog.onclose = null;
						};
					}, 10);
					iframe.contentWindow?.postMessage({ type: 'enlarged' }, '*');
					// iframe.requestFullscreen();
					break;
				case 'shrink':
					dialog.removeAttribute('enlarged');
					dialog.close();
					dialog.show();
					break;
			}
		});
	}
}