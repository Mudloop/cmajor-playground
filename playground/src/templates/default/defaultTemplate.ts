import { FileType, SourceFile } from "../../state/Types";
import processor from "./template.cmajor" with { type: 'text' };
import patch from "./template.cmajorpatch" with { type: 'text' };
export function defaultTemplate(name: string): SourceFile[] {
	let processorName = name.replace(/[^a-zA-Z0-9]/g, '');
	if (!/^[a-zA-Z]/.test(processorName)) processorName = 'My' + processorName;
	const fileName = name.replace(/[^a-zA-Z0-9 ]/g, '');
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
		}
	]

}

