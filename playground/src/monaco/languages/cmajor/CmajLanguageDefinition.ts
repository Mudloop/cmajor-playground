import { CmajSyntax } from './CmajSyntax';
import { config } from './CmajLanguageConfig';
import { formatCode, FormatterOptions } from './CMajFormatter';
import { LanguageDefinition } from '../types';
let formattingOptions: FormatterOptions | undefined = localStorage.getItem('formattingOptions') ? JSON.parse(localStorage.getItem('formattingOptions') as string) : undefined;
export const CmajLanguageDefinition: LanguageDefinition = {
	language: {
		id: "cmajor",
		extensions: ["cmajor"],
		mimetypes: ["application/cmajor"]
	},
	configutation: config,
	tokensProvider: CmajSyntax as any,
	documentFormattingEditProvider: {
		provideDocumentFormattingEdits: async (model, options, token) => {

			// if (!formattingOptions) {
			// 	console.log('formattingOptions not found');
			// 	const popup = new FormattingPopup();
			// 	await popup.waiter;
			// 	formattingOptions = localStorage.getItem('formattingOptions') ? JSON.parse(localStorage.getItem('formattingOptions') as string) : undefined;
			// 	if (!formattingOptions) {
			// 		console.log('formattingOptions not found');
			// 		return [];
			// 	}

			// }

			return [
				{
					range: model.getFullModelRange(),
					text: formatCode(model.getValue(), formattingOptions)
				}
			];
		}
	}
};

