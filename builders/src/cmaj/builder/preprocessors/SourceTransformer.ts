import { MagicFile, work } from '@cmajor-playground/utilities';
import workerSrc from '../../../../generated/source-transformer.worker.js' with { type: 'text' };
import { FilesWithHashes } from "../../../core";
import { Manifest } from "../../types";
import { Preprocessor } from "../Preprocessor";

export class SourceTransformer extends Preprocessor {
	public async process(files: FilesWithHashes, volumeId: string, mainFile: MagicFile) {
		const manifestPath = mainFile.path;
		const manifest = JSON.parse((await mainFile.content as string)) as Manifest;
		if (!manifest.sourceTransformer) return files;
		const url = new URL(`./$${volumeId}$${mainFile.id}/${manifest.sourceTransformer}`, document.location.href).href;
		return await work<FilesWithHashes>(workerSrc, { files, manifest, volumeId, url }, { type: 'module' });
	}

}