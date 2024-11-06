import { FileType, SourceFile } from "../../state/Types";
import processor from "./template.cmajor" with { type: 'text' };
import patch from "./template.cmajorpatch" with { type: 'text' };
import view from "./view/index.template.js" with { type: 'text' };
export function uiTemplate(name: string): SourceFile[] {
	let processorName = name.replace(/[^a-zA-Z0-9]/g, '');
	if (!/^[a-zA-Z]/.test(processorName)) processorName = 'My' + processorName;
	const fileName = name.replace(/[^a-zA-Z0-9 ]/g, '');
	let viewTag = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase().replaceAll('--', '-');
	if (!/^[a-zA-Z]/.test(viewTag)) viewTag = 'my-' + viewTag;
	return [
		{
			type: FileType.File,
			path: `${fileName}.cmajor`,
			content: processor.replaceAll('{{PROCESSOR}}', processorName),
		},
		{
			type: FileType.File,
			content: patch.replaceAll('{{NAME}}', name).replaceAll('{{FILENAME}}', fileName),
			path: `${fileName}.cmajorpatch`,
		},
		{
			type: FileType.Dir,
			path: `view`,
		},
		{
			type: FileType.File,
			path: 'view/' + `index.js`,
			content: view.replaceAll('__PROCESSOR__', processorName).replaceAll('{{VIEWTAG}}', viewTag),
		}
	]

}

