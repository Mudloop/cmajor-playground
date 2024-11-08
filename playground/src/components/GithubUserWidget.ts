import logo from '../../assets/img/logo.png' with { type: 'file' };
import { css, html, LitElement, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators";
import { keyed } from "lit/directives/keyed";
import { Playground } from "./Playground";
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
				<button @click=${(e: Event) => this.connectGithub(e)}>
					<ui-icon currentColors icon="github"></ui-icon>
					<span>Connect</span>
				</button>
			`

	connectGithub(e: any) {
		window.open('https://github.com/login/oauth/authorize?client_id=Ov23li52ClmsCJFfVhqc', '_blank');
	}
	disconnectGithub(e: any) {
		GithubAuth.disconnect();
		document.location.replace('./');
	}
}