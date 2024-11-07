import { FilesWithHashes } from "../../core";

export abstract class Preprocessor {
	public processFiles = (files: FilesWithHashes, volumeId: string) => this.process(files, volumeId)
	protected abstract process(files: FilesWithHashes, volumeId: string): Promise<FilesWithHashes> | FilesWithHashes;
}