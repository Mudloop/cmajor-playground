import { Trigger } from "./Trigger";

export class GithubAuth {
	static user: any = JSON.parse((globalThis as any).localStorage?.getItem('github_user_info') ?? 'null');
	static trigger: Trigger = new Trigger;
	static {
		if ((globalThis as any).localStorage) {
			this.updateUser();
			window.addEventListener('storage', e => {
				if (e.key == 'github_access_token') {
					this.updateUser();
				} if (e.key == 'github_user_info') {
					this.user = JSON.parse((globalThis as any).localStorage?.getItem('github_user_info') ?? 'null');
				}
			})
		}
	}
	private static async getUser() {
		if (!(globalThis as any).localStorage) return;
		if (!localStorage.github_access_token) return undefined;
		const res = await fetch('https://api.github.com/user', {
			headers: {
				'Accept': 'application/vnd.github+json',
				'Authorization': `Bearer ${localStorage.github_access_token}`,
				'X-GitHub-Api-Version': '2022-11-28'
			}
		});
		return await res.json();
	}
	private static updatePromise: Promise<any> | undefined;
	public static async updateUser() {
		this.user = await (this.updatePromise ??= this.getUser());
		localStorage.setItem('github_user_info', JSON.stringify(this.user ?? 'null'));
		this.trigger.trigger();
	}
	public static disconnect() {
		localStorage.removeItem('github_access_token')
		localStorage.removeItem('github_user_info')
	}
}
(globalThis as any).GithubAuth = GithubAuth;