import { LitElement, PropertyValues, css, html } from "lit";
import { customElement } from "lit/decorators";
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
	render = () => html`
		<dialog open>
			<iframe src="/"></iframe>
		</dialog>
	`;
	protected firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);
		const iframe = this.shadowRoot!.querySelector('iframe')!;
		const dialog = this.shadowRoot!.querySelector('dialog')!;
		iframe.contentWindow?.addEventListener('message', (e) => {
			console.log('Got request', e.data);
			switch (e.data.type) {
				case 'enlarge':
					if (dialog.hasAttribute('enlarged')) return;
					dialog.close();
					dialog.showModal();
					dialog.setAttribute('enlarged', '');
					setTimeout(() => {
						dialog.onclose = () => {
							console.log('Closing dialog');
							iframe.contentWindow?.postMessage({ type: 'shrunken' }, '*');
							dialog.onclose = null;
						};
					}, 10);
					iframe.contentWindow?.postMessage({ type: 'enlarged' }, '*');
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