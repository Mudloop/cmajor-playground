import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

export function loadIcons(...directories: string[]) {
	return Object.assign({}, ...directories.map(load));
}
function load(dir: string) {
	try {
		dir = import.meta.resolve(dir).replace('file://', '');
		if (!existsSync(dir)) return null;
		let files = readdirSync(dir).filter(file => file.endsWith('.svg'));
		return Object.fromEntries(files.map(file => {
			let key = file.replace('.svg', '');
			let icon = readFileSync(join(dir!, file), 'utf8');
			return [key, icon];
		}));

	} catch (e: any) {
		console.error(e);
		return { error: e.message };
	}
}