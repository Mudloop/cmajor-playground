const faustLang = await import("./FaustLang");
const providers = await faustLang.getProviders();
export const FaustLanguageDefinition = {
	language: faustLang.language,
	configutation: faustLang.config,
	themeData: faustLang.theme,
	hoverProvider: providers.hoverProvider,
	tokensProvider: providers.tokensProvider,
	completionItemProvider: providers.completionItemProvider
};
