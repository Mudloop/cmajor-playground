import { FaustBuilder, CmajorBuilder } from '@cmajor-playground/builders';
import { CmajLanguageDefinition, FaustLanguageDefinition } from './languages';
import { App, ZipLoader } from './state';
import { defaultTemplate, uiTemplate } from './templates';
await App.init({
	vfs: 'CmajPlayground', builds: 'builds',
	templates: { default: defaultTemplate, ui: uiTemplate },
	sources: { zip: ZipLoader },
	builders: [FaustBuilder, CmajorBuilder],
	languages: [CmajLanguageDefinition, FaustLanguageDefinition],
	serviceWorker: new URL('../../service.worker.js', import.meta.url)
});
export * from './components'