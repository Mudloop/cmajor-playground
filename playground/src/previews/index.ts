import { FaustRenderer, BuildRenderer, CmajRenderer } from "@cmajor-playground/builders";
import { render } from "lit";
(window as any).init = async (data: any, ctx: AudioContext, rootId: string) => {
	const getComponent = () => {
		switch (data.type) {
			case 'cmajor': return new CmajRenderer(data.build.manifest, data.build.version, data.build.code, rootId)
			case 'faust': return new FaustRenderer(data.build.json, data.build.wasm);
		}
	}
	const component = getComponent() as BuildRenderer;
	render(component, (document.getElementById('preview-container')!))
	await component.init(ctx);
}