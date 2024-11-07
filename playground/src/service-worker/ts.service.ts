import ts, { TranspileOptions } from 'typescript';
// @ts-ignore
return class {
	static compileTypeScript(code: string, options?: TranspileOptions) {
		options ??= {};
		options.compilerOptions ??= {
			module: ts.ModuleKind.Preserve,
			target: ts.ScriptTarget.ESNext,
			experimentalDecorators: true,
		};
		return ts.transpileModule(code, options).outputText;
	}
}