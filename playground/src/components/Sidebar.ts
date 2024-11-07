import logo from '../../assets/img/logo.png' with { type: 'file' };
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators";
import { keyed } from "lit/directives/keyed";
import { Playground } from "./Playground";
import { COMMON_STYLES } from './common-styles';

@customElement('cmaj-sidebar') export class Sidebar extends LitElement {
	@property({ type: Boolean }) hideProjectPanel = false;
	@property({ type: Object }) playground!: Playground;
	static styles = css`
		${COMMON_STYLES}
		.logo {
			display: flex;
			padding: 20px 8px;
			padding-bottom: 12px;
			gap: 8px;
			position: relative;
			width: fit-content;
		}
		.logo img {
			width: 100%;
			max-width: 150px;
			min-width: 150px;
			height: auto;
			
			opacity: .65;
		}
		.logo span {
			background-color: #fff;
			opacity: .8;
			padding: 2px 4px;
			font-size: 7px;
			border-radius: 4px;
			margin-right: 4px;
			color: black;
			text-transform: uppercase;
			font-weight: 900;
			letter-spacing: 1px;
			display: flex;
			align-items: center;
			align-self: start;
			position: absolute;
			right: 0;
			top: 17px;
		}
		.sidebar-top {
			min-height: 38px;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			border-bottom: 1px solid #4e4e4e;
		}
		.sidebar-top h3 {
			flex: 1;
			text-align: center;
			justify-content: center;
		}
		.sidebar-close {
			display: flex;
			justify-content: flex-end;
			padding: 4px;
		}
	`;
	render = () => html`
		<div class="sidebar-top">
			${this.hideProjectPanel
				? html`<h3>${this.playground.project!.info.name}</h3>`
				: html`<div class="logo"><img src="${new URL(logo, import.meta.url)}"><span>BETA</span></div>`}
			<slot name="close"></slot>
		</div>
		${this.hideProjectPanel
			? html`${this.playground.project?.info.modified ? html`<button @click=${() => this.playground.resetProject()}>Reset</button>` : ''}`
			: html`<cmaj-projects .playground=${this.playground}></cmaj-projects>`}
		${keyed(this.playground.project!.info.id, html`<cmaj-explorer .playground=${this.playground}></cmaj-explorer>`)}	
	`
}