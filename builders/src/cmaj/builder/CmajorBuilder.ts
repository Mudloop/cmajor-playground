import workerSrc from '../../../generated/cmajor.worker.js' with { type: 'text' };
import wasmPath from '../worker/cmaj_api/cmaj-compiler-wasm.wasm' with { type: 'file' };
import { extractStrings, hashString, MagicFile, MagicFS, sanitizePath, work } from '@cmajor-playground/utilities';
import { FilesWithHashes } from '../../core/types.js';
import { Manifest } from '../types';

import '@grame/faustwasm/libfaust-wasm/libfaust-wasm.wasm' with {type: 'file'}
import '@grame/faustwasm/libfaust-wasm/libfaust-wasm.data' with {type: 'file'}
import { Preprocessor } from './Preprocessor.js';
import { FaustPreprocessor, JSPreprocessor, TSPreprocessor } from './preprocessors';
const worker = workerSrc.replaceAll('./cmaj-compiler-wasm.wasm', new URL(wasmPath, import.meta.url).href);

export class CmajorBuilder {
	public static type = 'cmajor';
	private static cache: Record<string, any> = {};
	public static preprocessors: Preprocessor[] = [new JSPreprocessor(), new FaustPreprocessor()];
	public static test = (path: string) => path.endsWith('.cmajorpatch');
	static async update(fs: MagicFS, manifestFile: MagicFile, setDirty: (diry: boolean) => {}) {
		const manifestPath = manifestFile.path;
		const manifest = JSON.parse((await manifestFile.content as string)) as Manifest;
		let manifestParentPath = sanitizePath(manifestPath + '/../');
		if (manifestParentPath != '') manifestParentPath += '/';
		const extraPaths = extractStrings(manifest.externals).map(s => sanitizePath(manifestPath + '/../' + s));
		const extraFiles = await this.loadFiles(fs, extraPaths);
		const paths = !manifest.source ? [] : [manifest.source].flat().map(path => sanitizePath(manifestPath + '/../' + path));
		let files = await this.loadFiles(fs, paths);
		for (let preprocessor of this.preprocessors) files = await preprocessor.processFiles(files, fs.volumeId);
		const hash = await hashString(...Object.entries(files).map(([_, { hash }]) => hash)); //todo: add extras to hash
		const sources = Object.fromEntries(Object.entries(files).map(([key, { content }]) => [key.replace(manifestParentPath, ''), content]));
		const extras = Object.fromEntries(Object.entries(extraFiles).map(([key, { content }]) => [key.replace(manifestParentPath, ''), content]));
		manifest.source = Object.keys(sources);
		if (this.cache[hash]) {
			setDirty(false);
			return this.cache[hash];
		}
		setDirty(true);
		const result = await work(worker, { manifestPath: manifestPath.split('/').at(-1), files: { ...extras, ...sources }, manifest });
		return this.cache[hash] = {
			build: { ...result as any, manifest },
			hash
		}
	}

	private static loadFiles = async (fs: MagicFS, paths: string[]): Promise<FilesWithHashes> => {
		const ret: FilesWithHashes = {};
		for (let path of paths) {
			const file = await fs.get<MagicFile>(path);
			if (!file) continue;
			ret[path] = { content: await (file.content), hash: file.hash };
		}
		return ret;
	}
}
