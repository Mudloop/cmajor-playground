import { FaustMonoDspGenerator, FaustPolyDspGenerator } from "./faustwasm/index.js";
import { FaustUI } from "./faust-ui/index.js";
type FaustDspDistribution = { dspModule: WebAssembly.Module; dspMeta: FaustDspMeta; effectModule?: WebAssembly.Module; effectMeta?: FaustDspMeta; mixerModule?: WebAssembly.Module; };
type FaustDspMeta = import("./faustwasm/index.js").FaustDspMeta;
type FaustMonoAudioWorkletNode = import("./faustwasm/index.js").FaustMonoAudioWorkletNode;
type FaustPolyAudioWorkletNode = import("./faustwasm/index.js").FaustPolyAudioWorkletNode;
type FaustMonoScriptProcessorNode = import("./faustwasm/index.js").FaustMonoScriptProcessorNode;
type FaustPolyScriptProcessorNode = import("./faustwasm/index.js").FaustPolyScriptProcessorNode;
type FaustNode = FaustMonoAudioWorkletNode | FaustPolyAudioWorkletNode | FaustMonoScriptProcessorNode | FaustPolyScriptProcessorNode;

const createFaustNode = async (ctx: AudioContext, name = "template", voices = 0, sp = false, bufferSize = 512, meta?: FaustDspMeta): Promise<{ faustNode: FaustNode | null; dspMeta: FaustDspMeta }> => {
    meta ??= await (await fetch("./dsp-meta.json")).json() as FaustDspMeta;
    const dspModule = await WebAssembly.compileStreaming(await fetch("./dsp-module.wasm"));
    const faustDsp: FaustDspDistribution = { dspMeta: meta, dspModule };
    if (voices == 0) return { faustNode: await new FaustMonoDspGenerator().createNode(ctx, name, { module: faustDsp.dspModule, json: JSON.stringify(faustDsp.dspMeta), soundfiles: {} }, sp, bufferSize), dspMeta: meta };
    faustDsp.mixerModule = await WebAssembly.compileStreaming(await fetch("./mixer-module.wasm"));
    return {
        faustNode: await new FaustPolyDspGenerator().createNode(ctx, voices, name, { module: faustDsp.dspModule, json: JSON.stringify(faustDsp.dspMeta), soundfiles: {} },
            faustDsp.mixerModule, faustDsp.effectModule ? { module: faustDsp.effectModule, json: JSON.stringify(faustDsp.effectMeta), soundfiles: {} } : undefined, sp, bufferSize
        ), dspMeta: meta
    };
};

async function connectToAudioInput(ctx: AudioContext, id: string, faustNode: FaustNode, inputNode: MediaStreamAudioSourceNode) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, deviceId: id ? { exact: id } : undefined } });
    if (!stream) return inputNode;
    inputNode?.disconnect();
    inputNode = ctx.createMediaStreamSource(stream);
    inputNode.connect(faustNode);
    return inputNode;
};
async function createFaustUI(divFaustUI: HTMLElement, faustNode: FaustNode) {
    const $container = document.createElement("div");
    $container.style.margin = "0";
    $container.style.position = "absolute";
    $container.style.overflow = "auto";
    $container.style.display = "flex";
    $container.style.flexDirection = "column";
    $container.style.width = "100%";
    $container.style.height = "100%";
    divFaustUI.appendChild($container);
    const faustUI = new FaustUI({
        ui: faustNode.getUI(),
        root: $container,
        listenWindowMessage: false,
        listenWindowResize: true,
    });
    faustUI.paramChangeByUI = (path: any, value: any) => faustNode.setParamValue(path, value);
    faustNode.setOutputParamHandler((path, value) => faustUI.paramChangeByDSP(path, value));
    $container.style.minWidth = `${faustUI.minWidth}px`;
    $container.style.minHeight = `${faustUI.minHeight}px`;
    faustUI.resize();
};

export { createFaustNode, createFaustUI, connectToAudioInput };
