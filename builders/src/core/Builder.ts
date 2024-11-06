import { FileContents, MagicFile, MagicFS } from "@cmajor-playground/utilities";
export type Files = Record<string, FileContents>;
export type ContentWithHash = { content: FileContents; hash: string; };
export type FilesWithHashes = Record<string, ContentWithHash>;
export type BuilderPaths = { mainPath: string; paths: string[]; };
export type BuildInfo = { ready: boolean, hash: string, path: string, id: string, type?: string, build?: any, builder?: any };
export type Builder = {
	type: string;
	update(fs: MagicFS, file: MagicFile, setDirty: Function): Promise<{ hash: string, build: any }>;
	test(path: string): boolean;
}