import { LitElement, css, html, unsafeCSS } from "lit";
import { customElement, property } from "lit/decorators";
import { COMMON_STYLES } from "./common-styles";


@customElement('ui-loader') export class Loader extends LitElement {
	@property({ type: String }) label: string = '';
	static styles = css`
		${COMMON_STYLES}
		:host {
			width: 100%;
			height: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			position: relative;
			transform-origin: center;
		}
		.loader {
			width: 65px;
			aspect-ratio: 1;
			position: absolute;
			transform: scale(0.55);
		}
		.loader:before, .loader:after {
			content: "";
			position: absolute;
			border-radius: 50px;
			box-shadow: 0 0 0 3px inset #b3b0aa;
			animation: l4 2.5s infinite;
		}
		.loader:after { animation-delay: -1.25s; }
		@keyframes l4 {
			0% 		{ inset: 0 35px 35px 0;	}
			12.5% 	{ inset: 0 35px 0 0;	}
			25% 	{ inset: 35px 35px 0 0;	}
			37.5%	{ inset: 35px 0 0 0;	}
			50%		{ inset: 35px 0 0 35px;	}
			62.5%	{ inset: 0 0 0 35px;	}
			75%		{ inset: 0 0 35px 35px;	}
			87.5%	{ inset: 0 0 35px 0;	}
			100%	{ inset: 0 35px 35px 0;	}
		}
		${unsafeCSS(new Array(20).fill(0).map((_, i) => `
			:host([size="${(i * 10) + 10}"]) .loader { transform: scale(${i / 10 + .1}); }
			:host([size="${(i * 10) + 10}"]) { min-width: ${(i / 10 + .1) * 65}px; min-height: ${(i / 10 + .1) * 65}px; }
		`).join('\n'))}
	`;
	render = () => html`<div class="loader"></span>`;
}
