/** This class implements the API and much of the logic for communicating with
 *  an instance of a patch that is running.
 */
export class PatchConnection extends EventListenerList {
    /** Returns the current Cmajor version */
    getCmajorVersion(): any;
    /** Calling this will trigger an asynchronous callback to any status listeners with the
     *  patch's current state. Use addStatusListener() to attach a listener to receive it.
     */
    requestStatusUpdate(): void;
    /** Attaches a listener function that will be called whenever the patch's status changes.
     *  The function will be called with a parameter object containing many properties describing the status,
     *  including whether the patch is loaded, any errors, endpoint descriptions, its manifest, etc.
     */
    addStatusListener(listener: any): void;
    /** Removes a listener that was previously added with addStatusListener()
     */
    removeStatusListener(listener: any): void;
    /** Causes the patch to be reset to its "just loaded" state. */
    resetToInitialState(): void;
    /** Sends a value to one of the patch's input endpoints.
     *
     *  This can be used to send a value to either an 'event' or 'value' type input endpoint.
     *  If the endpoint is a 'value' type, then the rampFrames parameter can optionally be used to specify
     *  the number of frames over which the current value should ramp to the new target one.
     *  The value parameter will be coerced to the type that is expected by the endpoint. So for
     *  examples, numbers will be converted to float or integer types, javascript objects and arrays
     *  will be converted into more complex types in as good a fashion is possible.
     */
    sendEventOrValue(endpointID: any, value: any, rampFrames: any, timeoutMillisecs: any): void;
    /** Sends a short MIDI message value to a MIDI endpoint.
     *  The value must be a number encoded with `(byte0 << 16) | (byte1 << 8) | byte2`.
     */
    sendMIDIInputEvent(endpointID: any, shortMIDICode: any): void;
    /** Tells the patch that a series of changes that constitute a gesture is about to take place
     *  for the given endpoint. Remember to call sendParameterGestureEnd() after they're done!
     */
    sendParameterGestureStart(endpointID: any): void;
    /** Tells the patch that a gesture started by sendParameterGestureStart() has finished.
     */
    sendParameterGestureEnd(endpointID: any): void;
    /** Requests a callback to any stored-state value listeners with the current value of a given key-value pair.
     *  To attach a listener to receive these events, use addStoredStateValueListener().
     *  @param {string} key
     */
    requestStoredStateValue(key: string): void;
    /** Modifies a key-value pair in the patch's stored state.
     *  @param {string} key
     *  @param {Object} newValue
     */
    sendStoredStateValue(key: string, newValue: Object): void;
    /** Attaches a listener function that will be called when any key-value pair in the stored state is changed.
     *  The listener function will receive a message parameter with properties 'key' and 'value'.
     */
    addStoredStateValueListener(listener: any): void;
    /** Removes a listener that was previously added with addStoredStateValueListener().
     */
    removeStoredStateValueListener(listener: any): void;
    /** Applies a complete stored state to the patch.
     *  To get the current complete state, use requestFullStoredState().
     */
    sendFullStoredState(fullState: any): void;
    /** Asynchronously requests the full stored state of the patch.
     *  The listener function that is supplied will be called asynchronously with the state as its argument.
     */
    requestFullStoredState(callback: any): void;
    /** Attaches a listener function that will receive updates with the events or audio data
     *  that is being sent or received by an endpoint.
     *
     *  If the endpoint is an event or value, the callback will be given an argument which is
     *  the new value.
     *
     *  If the endpoint has the right shape to be treated as "audio" then the callback will receive
     *  a stream of updates of the min/max range of chunks of data that is flowing through it.
     *  There will be one callback per chunk of data, and the size of chunks is specified by
     *  the optional granularity parameter.
     *
     *  @param {string} endpointID
     *  @param {number} granularity - if defined, this specifies the number of frames per callback
     *  @param {boolean} sendFullAudioData - if false, the listener will receive an argument object containing
     *     two properties 'min' and 'max', which are each an array of values, one element per audio
     *     channel. This allows you to find the highest and lowest samples in that chunk for each channel.
     *     If sendFullAudioData is true, the listener's argument will have a property 'data' which is an
     *     array containing one array per channel of raw audio samples data.
     */
    addEndpointListener(endpointID: string, listener: any, granularity: number, sendFullAudioData: boolean): void;
    /** Removes a listener that was previously added with addEndpointListener()
     *  @param {string} endpointID
    */
    removeEndpointListener(endpointID: string, listener: any): void;
    /** This will trigger an asynchronous callback to any parameter listeners that are
     *  attached, providing them with its up-to-date current value for the given endpoint.
     *  Use addAllParameterListener() to attach a listener to receive the result.
     *  @param {string} endpointID
     */
    requestParameterValue(endpointID: string): void;
    /** Attaches a listener function which will be called whenever the value of a specific parameter changes.
     *  The listener function will be called with an argument which is the new value.
     *  @param {string} endpointID
     */
    addParameterListener(endpointID: string, listener: any): void;
    /** Removes a listener that was previously added with addParameterListener()
     *  @param {string} endpointID
    */
    removeParameterListener(endpointID: string, listener: any): void;
    /** Attaches a listener function which will be called whenever the value of any parameter changes in the patch.
     *  The listener function will be called with an argument object with the fields 'endpointID' and 'value'.
     */
    addAllParameterListener(listener: any): void;
    /** Removes a listener that was previously added with addAllParameterListener()
     */
    removeAllParameterListener(listener: any): void;
    /** This takes a relative path to an asset within the patch bundle, and converts it to a
     *  path relative to the root of the browser that is showing the view.
     *
     *  You need you use this in your view code to translate your asset URLs to a form that
     *  can be safely used in your view's HTML DOM (e.g. in its CSS). This is needed because the
     *  host's HTTP server (which is delivering your view pages) may have a different '/' root
     *  than the root of your patch (e.g. if a single server is serving multiple patch GUIs).
     *
     *  @param {string} path
     */
    getResourceAddress(path: string): string;
    /**
     *  This property contains various utility classes and functions from the Cmajor API,
     *  for use in your GUI or worker code.
     */
    utilities: {
        /** MIDI utility functions from cmaj-midi-helpers.js */
        midi: typeof midi;
        /** On-screen keyboard class from cmaj-piano-keyboard.js */
        PianoKeyboard: typeof PianoKeyboard;
        /** Basic parameter control GUI elements, from cmaj-parameter-controls.js */
        ParameterControls: typeof ParameterControls;
        /** The default view GUI, from cmaj-generic-patch-view.js */
        GenericPatchView: typeof GenericPatchView;
    };
    /** @private */
    private deliverMessageFromServer;
    manifest: any;
}
import { EventListenerList } from "./cmaj-event-listener-list.js";
import * as midi from "./cmaj-midi-helpers.js";
import PianoKeyboard from "./cmaj-piano-keyboard.js";
import * as ParameterControls from "./cmaj-parameter-controls.js";
import GenericPatchView from "./cmaj-generic-patch-view.js";
