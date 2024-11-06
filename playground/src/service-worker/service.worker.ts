import { isBinary, sanitizePath, VirtualFS } from "@cmajor-playground/utilities";
import ts from 'typescript';
import { mtype } from "../mtype";
const loc = new URL('.', location.href).href;
const vfs = new VirtualFS('CmajPlayground');
class PatchService {
	static {
		self.addEventListener('fetch', (event: FetchEvent) => this.handleFetch(event));
		self.addEventListener('install', (_event: any) => (self as any).skipWaiting());
		self.addEventListener('activate', (event: any) => event.waitUntil((globalThis as any).clients.claim()));
	}
	static handleFetch(event: FetchEvent) {
		const url = new URL(event.request.url).href.replace(loc, '');
		// console.log('url', url);
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
		const content = await (isBinary(mtype(path)) ? volume.readBinary(path) : volume.readText(path));
		if (path.endsWith('.ts')) {
			return new Response((compileTypeScript(content as string)), { headers: { 'Content-Type': 'application/javascript' } });
		}
		return new Response(content, { headers: { 'Content-Type': mtype(path) ?? 'text/plain' } });
	}
}
function compileTypeScript(code: string) {
	const result = ts.transpileModule(code, {
		compilerOptions: {
			module: ts.ModuleKind.Preserve,
			target: ts.ScriptTarget.ESNext,
			experimentalDecorators: true,
		}
	});
	return result.outputText;
}