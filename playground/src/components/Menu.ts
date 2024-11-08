import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators";

@customElement('ui-menu') export class Menu extends LitElement {
	static styles = css`
		:host {
			display: block;
			--left: 0;
			--top: 0;
		}
		.trigger { cursor: pointer; }
		dialog {
			z-index: 1000;
			margin: 0;
			transform: unset;
			outline: none !important;
			padding: 0;
			background: none;
			border: none;
			overflow: visible;
			left: var(--left);
			top: var(--top);
			
		}
		::slotted( *:not([slot="trigger"]) ) {
			max-height: calc(90vh - var(--top)) !important;
		}
		dialog::backdrop { backdrop-filter: blur(2px); }
	`;
	render = () => html`
		<div class="trigger"><slot name="trigger"></slot></div>
		<dialog><slot></slot></dialog>
	`;
	protected firstUpdated(_changedProperties: PropertyValues): void {
		const dialog = this.shadowRoot!.querySelector('dialog')!;
		dialog.onclick = () => dialog?.close();
		dialog.onclose = () => this.visible = false;
		this.addEventListener('pointerdown', this.open);
	}
	visible = false;
	open = (e: PointerEvent) => {
		if (e.button != 0) return;
		(this.shadowRoot!.querySelector('dialog')!).showModal();
		this.querySelector('input') && setTimeout(() => this.querySelector('input')!.focus(), 1);
		this.visible = true;
		this.updatePosition();
	}
	updatePosition = () => {
		if (!this.visible) return;
		const dialog = this.shadowRoot!.querySelector('dialog')!;
		const bounds = this.getBoundingClientRect();
		// dialog.style.left = bounds.left + 'px';
		// dialog.style.top = bounds.bottom + 'px';
		this.style.setProperty('--left', bounds.left + 'px');
		this.style.setProperty('--top', bounds.bottom + 'px');
		requestAnimationFrame(this.updatePosition)
	}
}