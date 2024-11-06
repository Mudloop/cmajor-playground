import JSZip from "jszip";
import { sanitizePath } from "./sanitizePath";
import { Volume } from "./VirtualFS";

export class VirtualFSExtensions {
	static async zipFolder(volume:Volume, path: string, zip?: JSZip, prefixPath: string = '') {
		path = sanitizePath(path);
		if (path != '') path += '/';
		prefixPath = sanitizePath(prefixPath);
		zip ??= new JSZip();
		await volume.db.read(['entries', 'content'], async (accessors) => {
			const entries = (await accessors.entries.find('volume', volume.id)).filter(f => f.path.startsWith(path));
			for (const entry of entries) {
				const destPath = sanitizePath(prefixPath + '/' + entry.path.slice(path.length));
				entry.type == 'file' ? zip.file(destPath, (await accessors.content.get(entry.hash)).content) : zip.folder(destPath);
			}
		});
		return zip;
	}
}