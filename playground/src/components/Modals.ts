import { LitElement, PropertyValues, css, html } from "lit";
import { customElement } from "lit/decorators";
import { unsafeHTML } from "lit/directives/unsafe-html";
export class Modals {
	static root: HTMLElement | ShadowRoot = document.body;
	static confirm = async (title: string, msg: any) => (await new Confirm(this.root, title, msg).promise) ?? false
	static prompt = async (title: string, message: string, defaultValue = '') => (await new Prompt(this.root, title, message, defaultValue).promise) as string;
	static alert = async (a: string, b?: string) => await (b ? new Alert(this.root, a, b) : new Alert(this.root, undefined, a)).promise
}
abstract class Modal<T = void> extends LitElement {
	static styles = css`
		dialog {
			z-index: 1000;
			transform: unset;
			outline: none !important;
			padding: 0;
			background-color: #202223;
			width: calc(100% - 40px);
			max-width: 300px;
			font-size: 12px;
			color: inherit;
			border: 1px solid #333;
			border-radius: 10px;
			box-shadow: 0 0 10px black;
		}
		dialog::backdrop {
			background-color: #000000;
			opacity: .8;
		}
		main, footer {
			padding: 8px 16px;
		}
		header {
			padding: 10px;
			width: 100%;
			font-weight: 900;
			text-transform: uppercase;
			background: #3131317a;
			border-bottom: 1px solid #44444466;
			color: #ffffffcc;
			text-align: center;
		}
		footer {
			gap: 10px;
			display: flex;
			justify-content: end;
			align-items: center;
		}
		button {
			outline: none !important;
			background: #444;
			border: none;
			padding: 8px 12px;
			color: #ffffffcc;
			border-radius: 6px;
			cursor: pointer;
		}
		button[disabled] {
			cursor: unset;
			opacity: .4;
		}
		main {
			display: flex;
			flex-direction: column;
			gap: 16px;
		}
		input {
			outline: none !important;
			background: #444;
			border: none;
			padding: 8px 12px;
			color: #ffffffcc;
			border-radius: 6px;
			width: 100%;
		}
		* {
			box-sizing: border-box;
		}
	`;
	constructor(root: HTMLElement | ShadowRoot, private label?: string) { super(); root.append(this); }
	protected toHTML = (msg: any) => typeof msg == 'string' ? unsafeHTML(msg.replaceAll('\n', '<br>')) : msg
	protected renderButtons = () => html`<button id="close">Close</button>`
	protected resolve!: (value: T | undefined) => void;
	public promise = new Promise<T | undefined>((resolve, reject) => { this.resolve = resolve; this.reject = reject; });
	protected reject!: (reason?: any) => void;
	abstract renderContent(): any;

	protected async firstUpdated(_changedProperties: PropertyValues) {
		const dialog = this.shadowRoot!.querySelector('dialog')!;
		const container = this.shadowRoot!.querySelector('div.container')! as HTMLElement;
		const btn = this.shadowRoot!.querySelector('button#close') as HTMLButtonElement;
		dialog.onclose = () => this.remove();
		dialog.onclick = () => this.resolve(undefined);
		container.onclick = (e) => {
			e.preventDefault();
			e.stopPropagation();
		}
		if (btn) {
			btn.onclick = (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.resolve(undefined)
			}
		}
		dialog.showModal();
		await this.promise;
		dialog.close();
	}
	render = () => html`
		<dialog class="drag-dialog">
			<div class="container">
				${this.label ? html`<header>${this.label}</header>` : ''}
				<main>${this.toHTML(this.renderContent())}</main>
				<footer>${this.renderButtons()}</footer>
			</div>
		</dialog>
	`;
}

@customElement('ui-alert') export class Alert extends Modal {
	constructor(root: HTMLElement | ShadowRoot, label: string | undefined, private msg: any) { super(root, label); }
	renderContent = () => this.msg
}

@customElement('ui-confirm') export class Confirm extends Modal<boolean> {
	constructor(root: HTMLElement | ShadowRoot, label: string | undefined, private msg: any) { super(root, label); }
	renderContent = () => this.msg
	renderButtons = () => html`
		<button id="no" @click=${() => this.resolve(false)}>Cancel</button>
		<button id="yes" @click=${() => this.resolve(true)}>Confirm</button>
	`
}

@customElement('ui-prompt') export class Prompt extends Modal<string> {
	constructor(root: HTMLElement | ShadowRoot, label: string | undefined, private msg: any, private init?: string) { super(root, label); }
	protected async firstUpdated(_changedProperties: PropertyValues) {
		super.firstUpdated(_changedProperties);
		const input = this.shadowRoot!.querySelector('input')!;
		input.onkeydown = (e) => (e.key == 'Enter' || e.key == 'Return') && (input.value ?? '' != '') ? this.resolve(input.value ?? '') : undefined
		input.oninput = this.validate;
		input.setSelectionRange(0, input.value.split('.')[0].length);
		this.validate();
	}
	validate = () => {
		const input = this.shadowRoot!.querySelector('input')!;
		const btn = this.shadowRoot!.querySelector('#yes') as HTMLButtonElement;
		if ((input.value ?? '') == '') btn.setAttribute('disabled', 'true');
		else btn.removeAttribute('disabled');
	}
	renderContent = () => html`
		<div>${this.toHTML(this.msg)}</div>
		<input type="text" value="${this.init}">
	`;
	renderButtons = () => html`
		<button id="no" @click=${() => this.resolve(undefined)}>Cancel</button>
		<button id="yes" @click=${() => this.resolve(this.shadowRoot!.querySelector('input')?.value ?? '')}>Confirm</button>
	`
}