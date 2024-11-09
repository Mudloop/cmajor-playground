import { MagicFile } from "@cmajor-playground/utilities";
import { FilesWithHashes } from "../../core";
import { Manifest } from "../types";

export abstract class Preprocessor {
	public abstract process(files: FilesWithHashes, volumeId: string, mainFile: MagicFile): Promise<FilesWithHashes> | FilesWithHashes;
}