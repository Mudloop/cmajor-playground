// import { CmajorBuilder, FaustBuilder } from "@cmajor-playground/builders";
// import { VirtualFS } from "@cmajor-playground/utilities";
// import { defaultTemplate, uiTemplate } from "../templates";
// import { ZipLoader, App } from ".";
// import { CmajLanguageDefinition, FaustLanguageDefinition } from "../languages";
// const vfs = new VirtualFS('CmajPlayground');
// const builds = await vfs.createVolume('builds');
// await builds.clear();
// export const _library = new App({
// 	vfs, builds,
// 	templates: { default: defaultTemplate, ui: uiTemplate },
// 	sources: { zip: ZipLoader },
// 	builders: [FaustBuilder, CmajorBuilder],
// 	languages: [CmajLanguageDefinition, FaustLanguageDefinition]
// });