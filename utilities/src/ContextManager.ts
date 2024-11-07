import { Trigger } from "./Trigger";

export class ContextManager {
	static interval: any;
	static muteChanged = new Trigger;
	static {
		globalThis.document?.addEventListener('pointerdown', () => this.userClicked(), { once: true });
		globalThis.document?.addEventListener('keydown', () => this.userClicked(), { once: true });
	}
	static userClicked() {
		if (this.userHasClicked) return;
		if (!this.currentContext) return;
		this.userHasClicked = true;
		this.checkContext();
		for (let resolver of [...this.resolvers]) resolver();
		this.resolvers.clear();
	}
	static get muted() { return localStorage.getItem('audio-muted') == 'true'; }
	static set muted(muted: boolean) {
		localStorage.setItem('audio-muted', muted.toString())
		this.muteChanged.trigger();
	}
	static userHasClicked = false;
	private static currentContext?: AudioContext;
	private static activated: boolean = false;
	static get context() {
		if (!this.currentContext) {
			this.currentContext = new AudioContext({ latencyHint: 0.00001 });
			this.currentContext.suspend();
		}
		return this.currentContext;
	}
	static get newContext() {
		this.reset();
		return this.context;
	}
	static reset() {
		this.currentContext?.close();
		this.activated = false;
		this.resolvers.clear();
		delete this.currentContext;
		clearInterval(this.interval);
	}
	private static checkContext() {
		if (!this.currentContext) return;
		if (!this.userHasClicked) return;
		const currentState = this.currentContext.state;
		const desiredState = this.activated && !this.muted ? 'running' : 'suspended';
		if (currentState == desiredState) return;
		if (currentState == 'closed') return;
		if (desiredState == 'suspended') this.currentContext.suspend();
		if (desiredState == 'running') {
			this.currentContext.resume();
			clearInterval(this.interval)
			this.interval = setInterval(() => {
				if (this.currentContext?.state == 'closed') {
					clearInterval(this.interval)
					this.resolvers.clear();
					return;
				}
				if (this.currentContext?.state != 'running') return;
				clearInterval(this.interval)
				for (let resolver of [...this.resolvers]) resolver();
				this.resolvers.clear();
			}, 10);

		}
	}
	static resolvers: Set<() => void> = new Set;
	static async activateContext() {
		if (this.activated) return;
		this.activated = true;
		this.checkContext();
		if (this.userHasClicked) return;
		if (this.context!.state == 'running') return;
		return new Promise<void>((resolve) => this.resolvers.add(resolve));
	}
	static toggleMute(muted?: boolean) {
		this.muted = muted ?? !this.muted;
		this.checkContext();
	}
}
(globalThis as any).ContextManager = ContextManager;