export class ServerSession extends EventListenerList {
    /** A server session must be given a unique sessionID.
     * @param {string} sessionID - this must be a unique string which is safe for
     *                             use as an identifier or filename
    */
    constructor(sessionID: string);
    sessionID: string;
    activePatchConnections: Set<any>;
    status: {
        connected: boolean;
        loaded: boolean;
    };
    lastServerMessageTime: number;
    checkForServerTimer: Timer;
    /** Call `dispose()` when this session is no longer needed and should be released. */
    dispose(): void;
    /** Attaches a listener function which will be called when the session status changes.
     *  The listener will be called with an argument object containing lots of properties
     *  describing the state, including any errors, loaded patch manifest, etc.
     */
    addStatusListener(listener: any): void;
    /** Removes a listener that was previously added by `addStatusListener()`
     */
    removeStatusListener(listener: any): void;
    /** Asks the server to asynchronously send a status update message with the latest status.
     */
    requestSessionStatus(): void;
    /** Returns the session's last known status object. */
    getCurrentStatus(): {
        connected: boolean;
        loaded: boolean;
    };
    /** Asks the server to load the specified patch into our session.
     */
    loadPatch(patchFileToLoad: any): void;
    currentPatchLocation: any;
    /** Tells the server to asynchronously generate a list of patches that it has access to.
     *  The function provided will be called back with an array of manifest objects describing
     *  each of the patches.
     */
    requestAvailablePatchList(callbackFunction: any): void;
    /** Creates and returns a new PatchConnection object which can be used to control the
     *  patch that this session has loaded.
     */
    createPatchConnection(): {
        session: any;
        manifest: any;
        dispose(): void;
        sendMessageToServer(message: any): void;
        getResourceAddress(path: any): any;
        getCmajorVersion(): any;
        requestStatusUpdate(): void;
        addStatusListener(listener: any): void;
        removeStatusListener(listener: any): void;
        resetToInitialState(): void;
        sendEventOrValue(endpointID: any, value: any, rampFrames: any, timeoutMillisecs: any): void;
        sendMIDIInputEvent(endpointID: any, shortMIDICode: any): void;
        sendParameterGestureStart(endpointID: any): void;
        sendParameterGestureEnd(endpointID: any): void;
        requestStoredStateValue(key: string): void;
        sendStoredStateValue(key: string, newValue: Object): void;
        addStoredStateValueListener(listener: any): void;
        removeStoredStateValueListener(listener: any): void;
        sendFullStoredState(fullState: any): void;
        requestFullStoredState(callback: any): void;
        addEndpointListener(endpointID: string, listener: any, granularity: number, sendFullAudioData: boolean): void;
        removeEndpointListener(endpointID: string, listener: any): void;
        requestParameterValue(endpointID: string): void;
        addParameterListener(endpointID: string, listener: any): void;
        removeParameterListener(endpointID: string, listener: any): void;
        addAllParameterListener(listener: any): void;
        removeAllParameterListener(listener: any): void;
        utilities: {
            midi: typeof import("./cmaj-midi-helpers.js");
            PianoKeyboard: typeof import("./cmaj-piano-keyboard.js").default;
            ParameterControls: typeof import("./cmaj-parameter-controls.js");
            GenericPatchView: typeof import("./cmaj-generic-patch-view.js").default;
        };
        deliverMessageFromServer(msg: any): void;
        listenersPerType: {};
        addEventListener(type: string, listener: any): void;
        removeEventListener(type: string, listener: any): void;
        addSingleUseListener(type: string, listener: any): void;
        dispatchEvent(type: string, event: any): void;
        getNumListenersForType(type: string): any;
    };
    /**
     *  Sets a custom audio input source for a particular endpoint.
     *
     *  When a source is changed, a callback is sent to any audio input mode listeners (see
     *  `addAudioInputModeListener()`)
     *
     *  @param {Object} endpointID
     *  @param {boolean} shouldMute - if true, the endpoint will be muted
     *  @param {Uint8Array | Array} fileDataToPlay - if this is some kind of array containing
     *  binary data that can be parsed as an audio file, then it will be sent across for the
     *  server to play as a looped input sample.
     */
    setAudioInputSource(endpointID: Object, shouldMute: boolean, fileDataToPlay: Uint8Array | any[]): void;
    /** Attaches a listener function to be told when the input source for a particular
     *  endpoint is changed by a call to `setAudioInputSource()`.
     */
    addAudioInputModeListener(endpointID: any, listener: any): void;
    /** Removes a listener previously added with `addAudioInputModeListener()` */
    removeAudioInputModeListener(endpointID: any, listener: any): void;
    /** Asks the server to send an update with the latest status to any audio mode listeners that
     *  are attached to the given endpoint.
     *  @param {string} endpointID
     */
    requestAudioInputMode(endpointID: string): void;
    /** Enables or disables audio playback.
     *  When playback state changes, a status update is sent to any status listeners.
     * @param {boolean} shouldBeActive
     */
    setAudioPlaybackActive(shouldBeActive: boolean): void;
    /** Asks the server to apply a new set of audio device properties.
     *  The properties object uses the same format as the object that is passed to the listeners
     *  (see `addAudioDevicePropertiesListener()`).
     */
    setAudioDeviceProperties(newProperties: any): void;
    /** Attaches a listener function which will be called when the audio device properties are
     *  changed.
     *
     *  You can remove the listener when it's no longer needed with `removeAudioDevicePropertiesListener()`.
     *
     *  @param listener - this callback will receive an argument object containing all the
     *                    details about the device.
     */
    addAudioDevicePropertiesListener(listener: any): void;
    /** Removes a listener that was added with `addAudioDevicePropertiesListener()` */
    removeAudioDevicePropertiesListener(listener: any): void;
    /** Causes an asynchronous callback to any audio device listeners that are registered. */
    requestAudioDeviceProperties(): void;
    /** Asks the server to asynchronously generate some code from the currently loaded patch.
     *
     *  @param {string} codeType - this must be one of the strings that are listed in the
     *                             status's `codeGenTargets` property. For example, "cpp"
     *                             would request a C++ version of the patch.
     *  @param {Object} [extraOptions] - this optionally provides target-specific properties.
     *  @param callbackFunction - this function will be called with the result when it has
     *                            been generated. Its argument will be an object containing the
     *                            code, errors and other metadata about the patch.
     */
    requestGeneratedCode(codeType: string, extraOptions?: Object | undefined, callbackFunction: any): void;
    /** Attaches a listener to be told when a file change is detected in the currently-loaded
     *  patch. The function will be called with an object that gives rough details about the
     *  type of change, i.e. whether it's a manifest or asset file, or a cmajor file, but it
     *  won't provide any information about exactly which files are involved.
     */
    addFileChangeListener(listener: any): void;
    /** Removes a listener that was previously added with `addFileChangeListener()`.
     */
    removeFileChangeListener(listener: any): void;
    /** Attaches a listener function which will be sent messages containing CPU info.
     *  To remove the listener, call `removeCPUListener()`. To change the rate of these
     *  messages, use `setCPULevelUpdateRate()`.
     */
    addCPUListener(listener: any): void;
    /** Removes a listener that was previously attached with `addCPUListener()`. */
    removeCPUListener(listener: any): void;
    /** Changes the frequency at which CPU level update messages are sent to listeners. */
    setCPULevelUpdateRate(framesPerUpdate: any): void;
    cpuFramesPerUpdate: any;
    /** Attaches a listener to be told when a file change is detected in the currently-loaded
     *  patch. The function will be called with an object that gives rough details about the
     *  type of change, i.e. whether it's a manifest or asset file, or a cmajor file, but it
     *  won't provide any information about exactly which files are involved.
     */
    addInfiniteLoopListener(listener: any): void;
    /** Removes a listener that was previously added with `addFileChangeListener()`. */
    removeInfiniteLoopListener(listener: any): void;
    /** Registers a virtual file with the server, under the given name.
     *
     *  @param {string} filename - the full path name of the file
     *  @param {Object} contentProvider - this object must have a property called `size` which is a
     *            constant size in bytes for the file, and a method `read (offset, size)` which
     *            returns an array (or UInt8Array) of bytes for the data in a given chunk of the file.
     *            The server may repeatedly call this method at any time until `removeFile()` is
     *            called to deregister the file.
     */
    registerFile(filename: string, contentProvider: Object): void;
    files: Map<any, any> | undefined;
    /** Removes a file that was previously registered with `registerFile()`. */
    removeFile(filename: any): void;
    /** An implementation subclass must call this when the session first connects
     *  @private
     */
    private handleSessionConnection;
    /** An implementation subclass must call this when a message arrives
     *  @private
     */
    private handleMessageFromServer;
    /** @private */
    private checkServerStillExists;
    /** @private */
    private setNewStatus;
    /** @private */
    private updateCPULevelUpdateRate;
    /** @private */
    private handleFileReadRequest;
    /** @private */
    private createReplyID;
    /** @private */
    private createRandomID;
}
import { EventListenerList } from "./cmaj-event-listener-list.js";
