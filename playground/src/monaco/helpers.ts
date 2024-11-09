import monaco from '@cmajor-playground/bunaco';
import { LanguageDefinition } from './languages';
export const getLanguage = (extension?: string) => (monaco.languages.getLanguages().find(lang => lang.extensions?.includes('.' + extension) || lang.extensions?.includes(extension!)))?.id;
export const registerLanguage = (lang: LanguageDefinition) => {
	monaco.languages.register(lang.language);
	if (lang.configutation) monaco.languages.setLanguageConfiguration(lang.language.id, lang.configutation);
	if (lang.themeData) monaco.editor.defineTheme("vs-dark", lang.themeData);
	if (lang.hoverProvider) monaco.languages.registerHoverProvider(lang.language.id, lang.hoverProvider);
	if (lang.tokensProvider) monaco.languages.setMonarchTokensProvider(lang.language.id, lang.tokensProvider);
	if (lang.completionItemProvider) monaco.languages.registerCompletionItemProvider(lang.language.id, lang.completionItemProvider);
	if (lang.documentFormattingEditProvider) monaco.languages.registerDocumentFormattingEditProvider(lang.language.id, lang.documentFormattingEditProvider);
}