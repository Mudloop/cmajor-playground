import { Manifest } from "../types.js";
import CmajorCompiler from "./cmaj_api/cmaj-embedded-compiler.js";
const sanitizePath = (path: string) => path.split('/').map(p => p.trim()).filter(p => (p || '.') != '.').filter((p, i, a) => p != '..' && a[i + 1] != '..').join('/')
self.onmessage = async function (event) {
	try {
		const compiler = new CmajorCompiler();
		const files = event.data.files as Record<string, string | Uint8Array>;
		const manifest = event.data.manifest as Manifest;
		const manifestPath = event.data.manifestPath;
		const manifestParent = sanitizePath(manifestPath + '/..');
		manifest.source = [manifest.source ?? []].flat().map(src => sanitizePath(src));
		files[event.data.manifestPath] = JSON.stringify(manifest);
		Object.entries(files).forEach(([filename, content]) => compiler.addSourceFile(sanitizePath(filename.substring(manifestParent.length)), content as any));
		const code = await compiler.createJavascriptCode();
		self.postMessage({ code, version: compiler.CmajorVersion });
	} catch (e: any) {
		console.error(e);
		self.postMessage({ error: e });
	}
}