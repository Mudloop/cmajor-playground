/**  This class provides a PatchConnection that controls a Cmajor audio worklet
 *   node.
 */
export class AudioWorkletPatchConnection extends PatchConnection {
    constructor(manifest: any);
    cachedState: {};
    /**  Initialises this connection to load and control the given Cmajor class.
     *
     *   @param {Object} parameters - the parameters to use
     *   @param {Object} parameters.CmajorClass - the generated Cmajor class
     *   @param {AudioContext} parameters.audioContext - a web audio AudioContext object
     *   @param {string} parameters.workletName - the name to give the new worklet that is created
     *   @param {string} parameters.hostDescription - a description of the host that is using the patch
     *   @param {number} [parameters.sessionID] - an integer to use for the session ID, or undefined to use a default
     *   @param {Object} [parameters.initialValueOverrides] - optional initial values for parameter endpoints
     *   @param {string} [parameters.rootResourcePath] - optionally, a root to use when resolving resource paths
     */
    initialise({ CmajorClass, audioContext, workletName, hostDescription, sessionID, initialValueOverrides, rootResourcePath }: {
        CmajorClass: Object;
        audioContext: AudioContext;
        workletName: string;
        hostDescription: string;
        sessionID?: number | undefined;
        initialValueOverrides?: Object | undefined;
        rootResourcePath?: string | undefined;
    }): Promise<void>;
    audioContext: AudioContext | undefined;
    rootResourcePath: any;
    inputEndpoints: any;
    outputEndpoints: any;
    audioNode: AudioWorkletNode | undefined;
    /**  Attempts to connect this connection to the default audio and MIDI channels.
     *   This must only be called once initialise() has completed successfully.
     *
     *   @param {AudioContext} audioContext - a web audio AudioContext object
     */
    connectDefaultAudioAndMIDI(audioContext: AudioContext): Promise<void>;
    sendMessageToServer(msg: any): void;
    requestStoredStateValue(key: any): void;
    sendStoredStateValue(key: any, newValue: any): void;
    getResourceAddress(path: any): any;
    readResource(path: any): Promise<Response>;
    readResourceAsAudioData(path: any): Promise<{
        frames: never[][];
        sampleRate: number;
    }>;
    /** @private */
    private startPatchWorker;
}
import { PatchConnection } from "./cmaj-patch-connection.js";
