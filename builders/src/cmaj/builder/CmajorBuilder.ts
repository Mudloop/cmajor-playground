import workerSrc from '../../../generated/cmajor.worker.js' with { type: 'text' };
import faustWorkerSrc from '../../../generated/faust.worker.js' with { type: 'text' };
import wasmPath from '../worker/cmaj_api/cmaj-compiler-wasm.wasm' with { type: 'file' };
import { extractStrings, FileContents, hashString, MagicFile, MagicFS, sanitizePath, work } from '@cmajor-playground/utilities';
import { FilesWithHashes } from '../../core/Builder';
import { Manifest } from '../types';
import moduleURL from '@grame/faustwasm/libfaust-wasm/libfaust-wasm.js' with {type: 'file'}
import '@grame/faustwasm/libfaust-wasm/libfaust-wasm.wasm' with {type: 'file'}
import '@grame/faustwasm/libfaust-wasm/libfaust-wasm.data' with {type: 'file'}

const faustModuleUrl = import.meta.resolve(moduleURL as any);
const worker = workerSrc.replaceAll('./cmaj-compiler-wasm.wasm', new URL(wasmPath, import.meta.url).href);
abstract class Preprocessor {
	public processFiles = (files: FilesWithHashes) => this.process(files)
	protected abstract process(files: FilesWithHashes): Promise<FilesWithHashes> | FilesWithHashes;
}

class FaustPreprocessor extends Preprocessor {
	private cache: Record<string, string> = {};
	protected process = async (files: FilesWithHashes) => Object.fromEntries(await Promise.all(Object.entries(files).map(async ([path, { content, hash }]) => {
		if (!path.endsWith('.dsp')) return [path, { content, hash }];
		const processorName = `faust_${hash}`;
		this.cache[hash] ??= await this.compile(content, processorName);
		return [path + '.cmajor', { content: this.cache[hash].replaceAll(processorName, path.split('/').at(-1)!.split('.')[0]), hash }];
	})))
	private compile = async (content: FileContents, filename: string): Promise<string> => {
		return await work(faustWorkerSrc, { content, faustModuleUrl, filename, target: 'cmajor' });
	}
}
export class CmajorBuilder {
	public static type = 'cmajor';
	private static cache: Record<string, any> = {};
	public static preprocessors: Preprocessor[] = [new FaustPreprocessor()];
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
		for (let preprocessor of this.preprocessors) files = await preprocessor.processFiles(files);
		const hash = await hashString(...Object.entries(files).map(([_, { hash }]) => hash)); //todo: add extras to hash
		const sources = Object.fromEntries(Object.entries(files).map(([key, { content }]) => [key.replace(manifestParentPath, ''), content]));
		const extras = Object.fromEntries(Object.entries(extraFiles).map(([key, { content }]) => [key.replace(manifestParentPath, ''), content]));
		manifest.source = Object.keys(sources);
		if (this.cache[hash]) {
			setDirty(false);
			return this.cache[hash];
		}
		setDirty(true);
		return this.cache[hash] = {
			build: await work(worker, { manifestPath: manifestPath.split('/').at(-1), files: { ...extras, ...sources }, manifest }),
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
