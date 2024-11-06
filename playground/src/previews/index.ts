import { FaustRenderer, BuildRenderer, CmajRenderer } from "@cmajor-playground/builders";
import { VirtualFS } from "@cmajor-playground/utilities";
import { render } from "lit";
import { Manifest } from "../state";
(window as any).init = async (volumeId: string, rootId: string, data: any, ctx: AudioContext) => {
	const getComponent = async () => {
		switch (data.type) {
			case 'cmajor': return new CmajRenderer(JSON.parse((await volume.readText(rootFile.path))) as Manifest, build.version, build.code, rootId)
			case 'faust': return new FaustRenderer(build.json, build.wasm);
		}
	}

	const pathname = document.location.pathname.substring(2);
	// const [volumeId, rootId] = pathname.substring(0, pathname.indexOf('/')).split('$');
	const vfs = new VirtualFS('CmajPlayground');
	const volume = await vfs.getVolume(volumeId);
	const rootFile = await volume.getById(rootId);
	const build = data.build;
	const container = document.getElementById('preview-container')!;
	const component = await getComponent() as BuildRenderer;
	render(component, container)
	await component.init(ctx);



}