import ts, { CustomTransformerFactory, ModuleResolutionKind, SourceFile, TransformationContext, Transformer, TransformerFactory, TranspileOptions } from 'typescript';
console.log('creating ts service');
// @ts-ignore
return class {
	static transformer: TransformerFactory<SourceFile> | CustomTransformerFactory;
	static compileTypeScript(name: string, code: string, options?: TranspileOptions) {
		options ??= {};
		options.compilerOptions ??= {
			module: ts.ModuleKind.Preserve,
			target: ts.ScriptTarget.ESNext,
			experimentalDecorators: true,
			allowJs: true,
			moduleResolution: ModuleResolutionKind.Classic
		};
		this.transformer = <T extends ts.Node>(context: TransformationContext) => {
			return (node: T) => {
				function visit(node: ts.Node): ts.Node {
					// Check if the node is an import declaration
					if (ts.isImportDeclaration(node)) {
						const importPath = node.moduleSpecifier.getText().slice(1, -1); // Remove quotes around the path
						console.log('visiting', importPath, !importPath.startsWith("/") && !importPath.startsWith(".") && !importPath.startsWith('http:') && !importPath.startsWith('https:'));
						// Only transform if the path does not contain '/', '.', or a protocol
						if (!importPath.startsWith("/") && !importPath.startsWith(".") && !importPath.startsWith('http:') && !importPath.startsWith('https:')) {

							// Replace the import path with "https://esm.sh/..."
							const newImportPath = ts.factory.createStringLiteral(`https://esm.sh/${importPath}`);
							console.log(newImportPath);
							return ts.factory.updateImportDeclaration(
								node,
								node.modifiers,
								node.importClause,
								newImportPath,
								node.attributes
							);
						}
					}
					return node;
				}
				return ts.visitEachChild(node, visit, context);
			}
		}

		const result = ts.transpileModule(code, {
			...options,
			fileName: name,
			transformers: { before: [this.transformer] }
		}).outputText;
		return result;
	}
}