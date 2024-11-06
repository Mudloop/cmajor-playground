import { FaustRenderer, BuildRenderer, CmajRenderer } from "@cmajor-playground/builders";
import { ContextManager } from "@cmajor-playground/utilities";
import { render } from "lit";
(window as any).init = async (data: any, contextManager: typeof ContextManager, rootId: string) => {
	const getComponent = () => {
		switch (data.type) {
			case 'cmajor': return new CmajRenderer(data.build.manifest, data.build.version, data.build.code, rootId)
			case 'faust': return new FaustRenderer(data.build.json, data.build.wasm);
		}
	}
	const component = getComponent() as BuildRenderer;
	render(component, (document.getElementById('preview-container')!))
	await component.init(contextManager);
}