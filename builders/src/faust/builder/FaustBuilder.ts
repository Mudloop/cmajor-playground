import workerSrc from '../../../generated/faust.worker.js' with { type: 'text' };
import moduleURL from '@grame/faustwasm/libfaust-wasm/libfaust-wasm.js' with {type: 'file'}
import '@grame/faustwasm/libfaust-wasm/libfaust-wasm.wasm' with {type: 'file'}
import '@grame/faustwasm/libfaust-wasm/libfaust-wasm.data' with {type: 'file'}
import { Builder, Files } from '../../core/types.js';
import { hashString, MagicFile, MagicFS, work } from '@cmajor-playground/utilities';
const faustModuleUrl = import.meta.resolve(moduleURL as any);
export class FaustBuilder {
	public static type = 'faust';
	private static cache: Record<string, any> = {};
	public static test = (path: string) => path.endsWith('.dsp');
	static async update(fs: MagicFS, dsp: MagicFile, setDirty: (diry: boolean) => {}) {
		const hash = dsp.hash;
		if (this.cache[hash]) {
			setDirty(false);
			return this.cache[hash];
		}
		setDirty(true);
		return this.cache[hash] = {
			build: await work(workerSrc, { content: await dsp.content, faustModuleUrl, filename: dsp.name, target: 'wasm' }),
			hash
		}
	}
}