import { FaustRenderer, RendererBase, CmajRenderer, RendererOptions } from "@cmajor-playground/builders";
import { render } from "lit";
(window as any).init = async (options: RendererOptions) => {
	const getComponent = () => {
		switch (options.type) {
			case 'cmajor': return new CmajRenderer();
			case 'faust': return new FaustRenderer();
		}
	}
	const component = getComponent() as RendererBase;
	render(component, (document.getElementById('preview-container')!))
	return await component.init(options);
}