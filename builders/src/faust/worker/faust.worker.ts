import { instantiateFaustModuleFromFile, LibFaust, FaustCompiler, FaustMonoDspGenerator } from '@grame/faustwasm/dist/esm/index'
const root = globalThis as any;
root.window = globalThis;
self.onmessage = async function (event) {
	try {
		const data = event.data;
		const content = data.content;
		const target = data.target;
		const faustModuleUrl = data.faustModuleUrl
		const filename = data.filename;
		const faustModule = await instantiateFaustModuleFromFile(faustModuleUrl as any);
		const libFaust = new LibFaust(faustModule as any);
		root.libFaust = libFaust;
		const compiler = new FaustCompiler(libFaust);
		const name = filename.split('/').at(-1)!.split('.')[0].trim();
		if (target == 'cmajor') {
			if (!compiler.generateAuxFiles(name, content, "-lang cmajor-hybrid -cn " + name + " -o foo.cmajor")) throw new Error('Ooops')
			self.postMessage(compiler.fs().readFile('foo.cmajor', { encoding: "utf8" }));
		} else {
			const generator = new FaustMonoDspGenerator();
			await generator.compile(compiler, name, content, "-lang wasm-i -json -ct 1 -es 1 -mcd 16 -mdd 1024 -mdy 33 -single -ftz 2");
			const bytes = generator.factory!.code;
			const json = JSON.parse(generator.factory!.json);
			const base64 = btoa(String.fromCharCode(...bytes));
			self.postMessage({ wasm: base64, json });
		}
	} catch (e: any) {
		self.postMessage({ error: e.message });
	}
}