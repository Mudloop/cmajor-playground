const textBasedTypes = [
	'application/json',
	'application/javascript',
	'application/xml',
	'text/plain',
	'text/html',
	'text/css',
	'application/svg+xml',
	'image/svg+xml'
];
export const isBinary = (mimeType?: string | null) => mimeType != null && !textBasedTypes.includes(mimeType) && !mimeType.startsWith('text/')