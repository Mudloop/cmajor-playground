import { isBinary, sanitizePath, VirtualFS } from "@cmajor-playground/utilities";
import { mtype } from "../mtype";
import tsPath from './temp/ts.service.js' with {type: 'file'};
const loc = new URL('.', location.href).href;
const vfs = new VirtualFS('CmajPlaygroundProjects');
class ServiceRouter {
	static init() {
		self.addEventListener('fetch', (event: FetchEvent) => this.handleFetch(event));
		self.addEventListener('install', (_event: any) => (self as any).skipWaiting());
		self.addEventListener('activate', (event: any) => event.waitUntil((globalThis as any).clients.claim()));
	}
	static handleFetch(event: FetchEvent) {
		const url = new URL(event.request.url).href.replace(loc, '');
		url.startsWith('$') ? event.respondWith(this.serveFromVolume(url.substring(1))) : undefined
	}
	static async serveFromVolume(url: string): Promise<Response> {
		const [volumeId, rootId] = url.substring(0, url.indexOf('/')).split('$');
		let path = sanitizePath(decodeURIComponent(url.substring(url.indexOf('/'))));
		if (path == '') return new Response((await (await fetch(new URL('./preview.html', globalThis.location.href))).blob()));
		const volume = await vfs.getVolume(volumeId);
		if (rootId) {
			const rootFile = await volume.getById(rootId)!;
			path = sanitizePath(rootFile?.type == 'dir' ? rootFile.path + '/' + path : rootFile?.path + '/../' + path);
		}
		const mime = mtype(path) ?? 'text/plain';
		const content = isBinary(mime) ? await volume.readBinary(path) : await volume.readText(path);
		if (path.endsWith('.ts')) {
			return new Response((await this.compileTypeScript(content as string)), { headers: { 'Content-Type': 'application/javascript' } });
		}
		return new Response(content, { headers: { 'Content-Type': mime } });
	}
	static tsCompiler: Promise<any>;
	static compileTypeScript = async (code: string) => (await (this.tsCompiler ??= this.loadCompiler())).compileTypeScript(code);
	static async loadCompiler() {
		const res = await fetch(tsPath);
		const src = await res.text();
		return await new Function(`${src}`)();
	}
}
ServiceRouter.init();