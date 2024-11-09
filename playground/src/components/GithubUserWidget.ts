import { css, html, LitElement, PropertyValues } from "lit";
import { customElement } from "lit/decorators";
import { COMMON_STYLES } from './common-styles';
import { GithubAuth } from '@cmajor-playground/utilities';

@customElement('cmaj-github-user-widget') export class GithubUserWidget extends LitElement {
	static styles = css`
		${COMMON_STYLES}
		:host {
			width: 100%;
			display: flex;
			align-items: center;
		}
		label {
			display: flex;
			align-items: center;
			gap: 4px;
			height: 100%;
			flex: 1;
			padding: 4px;
			background-color: #ffffff11;
		}
	`;
	user: any;
	protected firstUpdated(_changedProperties: PropertyValues) {
		GithubAuth.trigger.add(() => this.requestUpdate());
	}
	render = () => GithubAuth.user
		? html`
				<label>
					<ui-icon currentColors icon="github"></ui-icon>
					${GithubAuth.user.login}
				</label>
				<button @click=${(e: Event) => this.disconnectGithub(e)}>
					<ui-icon currentColors icon="tabler-logout"></ui-icon>
				</button>
			`
		: html`
				<button style="flex:1" @click=${(e: Event) => this.connectGithub(e)}>
					<ui-icon currentColors icon="github"></ui-icon>
					<span>Connect</span>
				</button>
			`;
	popupCenter = (url: string, title: string, w: number, h: number) => {
		// Fixes dual-screen position                             Most browsers      Firefox
		const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
		const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;

		const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
		const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

		const systemZoom = width / window.screen.availWidth;
		const left = (width - w) / 2 / systemZoom + dualScreenLeft
		const top = (height - h) / 2 / systemZoom + dualScreenTop
		const newWindow = window.open(url, title,
			`
				scrollbars=yes,
				width=${w / systemZoom}, 
				height=${h / systemZoom}, 
				top=${top}, 
				left=${left}
				`
		)

		newWindow?.focus();
	}
	connectGithub(e: any) {
		const url = 'https://github.com/login/oauth/authorize?client_id=Ov23li52ClmsCJFfVhqc';
		this.popupCenter(url, 'Github Connect', 800, 600);
	}
	disconnectGithub(e: any) {
		GithubAuth.disconnect();
		document.location.replace('./');
	}
}