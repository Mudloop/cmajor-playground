export type FormatterOptions = {
	indentation?: {
		style?: 'spaces' | 'tabs';
		size?: number;
	};
	braces?: {
		newline?: boolean;
	};
};

export function formatCode(code: string, options?: FormatterOptions): string {
	const indentationStyle = options?.indentation?.style ?? 'tabs';
	const indentationSize = options?.indentation?.size ?? 4;
	const braceNewline = options?.braces?.newline ?? false;
	// console.log('formatting', options);
	
	const indentUnit = indentationStyle === 'spaces' ? ' '.repeat(indentationSize) : '\t';
	

	const lines = code.split('\n');
	if (braceNewline) {
		for (let i = 0; i < lines.length - 1; i++) {
			const currentLine = lines[i];
			const nextLine = lines[i + 1];
			const trimmedCurrentLine = currentLine.trim();

			if (trimmedCurrentLine.endsWith('{')) {
				// lines[i] = trimmedCurrentLine.replace('{', '').trim();
				// lines[i + 1] = '{';
				// lines.splice(i + 1, 0, nextLine);
			}
		}
	} else {
		for (let i = 1; i < lines.length - 1; i++) {
			const currentLine = lines[i];
			const prevLine = lines[i - 1];
			const trimmedCurrentLine = currentLine.trim();

			if (trimmedCurrentLine === '{' && !prevLine.includes('//')) {
				lines[i - 1] = `${prevLine.trim()} {`;
				lines.splice(i, 1);
				// x§i--;
			}
		}

	}

	let indentLevel = 0;
	const formattedLines = lines.map(line => line.trim())
		.map(line => {
			if (line.startsWith('}')) indentLevel = Math.max(indentLevel - 1, 0);
			const indentedLine = `${indentUnit.repeat(indentLevel)}${line}`;
			if (line.endsWith('{')) indentLevel += 1;

			return indentedLine;
		});

	return formattedLines.join('\n');
}