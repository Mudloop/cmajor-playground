import workerSrc from '../../../../generated/faust.worker.js' with { type: 'text' };
import moduleURL from '@grame/faustwasm/libfaust-wasm/libfaust-wasm.js' with {type: 'file'}
import { FilesWithHashes } from "../../../core";
import { Preprocessor } from "../Preprocessor";
import { FileContents, work } from '@cmajor-playground/utilities';
const faustModuleUrl = import.meta.resolve(moduleURL as any);

export class FaustPreprocessor extends Preprocessor {
	private cache: Record<string, string> = {};
	protected process = async (files: FilesWithHashes) => Object.fromEntries(await Promise.all(Object.entries(files).map(async ([path, { content, hash }]) => {
		if (!path.endsWith('.dsp')) return [path, { content, hash }];
		const processorName = `faust_${hash}`;
		this.cache[hash] ??= await this.compile(content, processorName);
		return [path + '.cmajor', { content: this.cache[hash].replaceAll(processorName, path.split('/').at(-1)!.split('.')[0]), hash }];
	})))
	private compile = async (content: FileContents, filename: string): Promise<string> => {
		return await work(workerSrc, { content, faustModuleUrl, filename, target: 'cmajor' });
	}
}