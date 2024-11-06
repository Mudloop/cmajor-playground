import JSZip from "jszip";
import { SourceFile } from "./Types";
import { isBinary } from "@cmajor-playground/utilities";
import { mtype } from "../mtype";
export class ZipLoader {
	static test = (identifier: string) => identifier.endsWith('.zip')
	static async import(identifier: string): Promise<{ name: string; meta: any; files: SourceFile[]; }> {
		const res = await fetch(identifier);
		const data = await res.arrayBuffer();
		return await this.loadZip(identifier, data);
	}
	static async loadZip(filename: string, data: ArrayBuffer) {
		const name = (filename.split('/').pop() ?? 'Unknown').split('.').shift() ?? 'Unknown';
		const zip = new JSZip();
		await zip.loadAsync(data);
		const files: any[] = [];
		const promises = Object.entries(zip.files).map(async ([path, file]) => {
			const name = path.split('/').pop() ?? 'Unknown';
			if(name.startsWith('.')) return;
			const type = mtype(path);
			const binary = isBinary(type!);
			files.push(file.dir ? { type: 'dir' as any, path } : { type: 'file' as any, path, content: await file.async(binary ? 'uint8array' : 'text') });
		});
		await Promise.all(promises);
		return { name, meta: {}, files };
	}

}