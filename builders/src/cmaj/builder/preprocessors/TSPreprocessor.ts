import { FilesWithHashes } from "../../../core";
import { Preprocessor } from "../Preprocessor";
import ts from 'typescript';

export class TSPreprocessor extends Preprocessor {
	protected process = async (files: FilesWithHashes) => Object.fromEntries(await Promise.all(Object.entries(files).map(async ([path, { content, hash }]) => {
		if (!path.endsWith('.ts')) return [path, { content, hash }];
		return [path + '.js', { content: await this.compile(content as string), hash }];
	})))
	private compile = async (content: string): Promise<string> => {
		return ts.transpileModule(content, {
			compilerOptions: {
				module: ts.ModuleKind.Preserve,
				target: ts.ScriptTarget.ESNext,
				experimentalDecorators: true,
			}
		}).outputText;
	}
}