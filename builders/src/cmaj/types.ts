export type Manifest = {
	CmajorVersion?: number;
	ID?: string;
	version?: string;
	name?: string;
	description?: string;
	category?: string;
	manufacturer?: string;
	isInstrument?: boolean;
	sourceTransformer?: string;
	view?: {
		src: string;
		resizable: boolean;
		width?: number;
		height?: number;
	};
	worker?: string;
	source?: string | string[];
	externals?: Record<string, any>;
};
export type EndpointDataType = { type: string }
export type Endpoint = {
	endpointID: string,
	endpointType: 'value' | 'event' | 'stream',
	dataType?: EndpointDataType,
	dataTypes?: EndpointDataType[],
	annotation: Record<string, any>,
	purpose?: 'parameter' | 'midi in' | 'audio in' | string
}