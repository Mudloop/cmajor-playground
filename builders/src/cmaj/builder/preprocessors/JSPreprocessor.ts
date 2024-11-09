import { work } from "@cmajor-playground/utilities";
import { FilesWithHashes } from "../../../core";
import { Preprocessor } from "../Preprocessor";

export class JSPreprocessor extends Preprocessor {
	public process = async (files: FilesWithHashes, volumeId: string) => {
		return Object.fromEntries(await Promise.all(Object.entries(files).map(async ([path, { content, hash }]) => {
			if (!path.endsWith('.js') && !path.endsWith('.ts')) return [path, { content, hash }];
			return [path + '.cmajor', { content: await this.compile(volumeId, path, content as string), hash }];
		})));
	}
	private compile = async (volumeId: string, path: string, src: string): Promise<string> => {
		const url = new URL(`./$${volumeId}/${path}`, document.location.href).href;
		return await work<string>(/*js*/ `
			self.onmessage = async function (event) {
				const module = await import(event.data);
				self.postMessage(typeof module.default == 'function' ? await module.default(this) : module.default);
			}
		`, url, { type: 'module' });
	}
}