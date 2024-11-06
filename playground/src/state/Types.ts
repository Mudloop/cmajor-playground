import { Builder } from "@cmajor-playground/builders";
import { MagicFS, VirtualFS, Volume } from "@cmajor-playground/utilities";
import monaco from '@cmajor-playground/bunaco';

export type PatchView = {
	src: string;
	resizable: boolean;
	width?: number;
	height?: number;
};
export type Manifest = {
	CmajorVersion?: number;
	ID?: string;
	version?: string;
	name?: string;
	description?: string;
	category?: string;
	manufacturer?: string;
	isInstrument?: boolean;
	sourceTransformer?: string;
	view?: PatchView;
	worker?: string;
	source?: string | string[];
	externals?: Record<string, any>;
};
export type BuildResult = {
	code: string;
	version: string;
	manifest: Manifest;
	files: Record<string, string>;
}

export enum FileType {
	File = 'file',
	Dir = 'dir'
}
export type SourceFile = {
	type: 'file' | 'dir',
	path: string,
	content?: string | Uint8Array
}
export type ProjectInfo = {
	name: string;
	id: string;
	source?: ProjectSourceInfo;
	modified?: boolean;
};
export type ProjectTemplate = (name: string) => Promise<SourceFile[]> | SourceFile[];
export type AppConfig = {
	vfs: string;
	builds: string;
	examples: Record<string, string>;
	templates: Record<string, ProjectTemplate>;
	sources: Record<string, ProjectSource>;
	builders: Builder[];
	languages: LanguageDefinition[];
	serviceWorker: URL;
};
export type ProjectSourceInfo = {
	type: string;
	identifier?: string;
	meta?: any;
};
export type ProjectSource = {
	test(identifier: string): boolean;
	import(identifier: string): Promise<{ name: string; meta: any; files: SourceFile[]; }>;
};

export type LanguageDefinition = {
	language: monaco.languages.ILanguageExtensionPoint,
	configutation?: monaco.languages.LanguageConfiguration,
	themeData?: monaco.editor.IStandaloneThemeData,
	hoverProvider?: monaco.languages.HoverProvider,
	tokensProvider?: monaco.languages.IMonarchLanguage,
	completionItemProvider?: monaco.languages.CompletionItemProvider
	documentFormattingEditProvider?: monaco.languages.DocumentFormattingEditProvider
}