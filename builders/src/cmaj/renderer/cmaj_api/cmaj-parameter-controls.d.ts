/** Fetches all the CSS for the controls defined in this module */
export function getAllCSS(): string;
/** Creates a suitable control for the given endpoint.
 *
 *  @param {PatchConnection} patchConnection - the connection to connect to
 *  @param {Object} endpointInfo - the endpoint details, as provided by a PatchConnection
 *                                 in its status callback.
*/
export function createControl(patchConnection: PatchConnection, endpointInfo: Object): Knob | Switch | Options | undefined;
/** Creates a suitable labelled control for the given endpoint.
 *
 *  @param {PatchConnection} patchConnection - the connection to connect to
 *  @param {Object} endpointInfo - the endpoint details, as provided by a PatchConnection
 *                                 in its status callback.
*/
export function createLabelledControl(patchConnection: PatchConnection, endpointInfo: Object): LabelledControlHolder | undefined;
/** Takes a patch connection and its current status object, and tries to create
 *  a control for the given endpoint ID.
 *
 *  @param {PatchConnection} patchConnection - the connection to connect to
 *  @param {Object} status - the connection's current status
 *  @param {string} endpointID - the endpoint you'd like to control
 */
export function createLabelledControlForEndpointID(patchConnection: PatchConnection, status: Object, endpointID: string): LabelledControlHolder | undefined;
/** A base class for parameter controls, which automatically connects to a
 *  PatchConnection to monitor a parameter and provides methods to modify it.
 */
export class ParameterControlBase extends HTMLElement {
    onmousedown: (e: any) => any;
    /** Attaches the control to a given PatchConnection and endpoint.
     *
     * @param {PatchConnection} patchConnection - the connection to connect to, or pass
     *                                            undefined to disconnect the control.
     * @param {Object} endpointInfo - the endpoint details, as provided by a PatchConnection
     *                                in its status callback.
     */
    setEndpoint(patchConnection: PatchConnection, endpointInfo: Object): void;
    patchConnection: PatchConnection | undefined;
    endpointInfo: Object | undefined;
    defaultValue: any;
    /** Override this method in a child class, and it will be called when the parameter value changes,
     *  so you can update the GUI appropriately.
     */
    valueChanged(newValue: any): void;
    /** Your GUI can call this when it wants to change the parameter value. */
    setValue(value: any): void;
    /** Call this before your GUI begins a modification gesture.
     *  You might for example call this if the user begins a mouse-drag operation.
     */
    beginGesture(): void;
    /** Call this after your GUI finishes a modification gesture */
    endGesture(): void;
    /** This calls setValue(), but sandwiches it between some start/end gesture calls.
     *  You should use this to make sure a DAW correctly records automatiion for individual value changes
     *  that are not part of a gesture.
     */
    setValueAsGesture(value: any): void;
    /** Resets the parameter to its default value */
    resetToDefault(): void;
    /** @private */
    private connectedCallback;
    /** @protected */
    protected disconnectedCallback(): void;
    /** @private */
    private detachListener;
    listener: ((newValue: any) => void) | undefined;
    /** @private */
    private attachListener;
}
/** A simple rotary parameter knob control. */
export class Knob extends ParameterControlBase {
    /** Returns true if this type of control is suitable for the given endpoint info */
    static canBeUsedFor(endpointInfo: any): boolean;
    /** @private */
    private static getCSS;
    constructor(patchConnection: any, endpointInfo: any);
    setEndpoint(patchConnection: any, endpointInfo: any): void;
    getDashOffset: ((val: any) => number) | undefined;
    trackValue: any;
    dial: HTMLDivElement | undefined;
    toRotation: ((value: any) => any) | undefined;
    rotation: any;
    previousScreenY: any;
    accumulatedRotation: any;
    previousClientY: any;
    touchIdentifier: any;
    /** Returns a string version of the given value */
    getDisplayValue(v: any): string;
    /** @private */
    private setRotation;
}
/** A boolean switch control */
export class Switch extends ParameterControlBase {
    /** Returns true if this type of control is suitable for the given endpoint info */
    static canBeUsedFor(endpointInfo: any): any;
    /** @private */
    private static getCSS;
    constructor(patchConnection: any, endpointInfo: any);
    setEndpoint(patchConnection: any, endpointInfo: any): void;
    currentValue: boolean | undefined;
    /** Returns a string version of the given value */
    getDisplayValue(v: any): string;
}
/** A control that allows an item to be selected from a drop-down list of options */
export class Options extends ParameterControlBase {
    /** Returns true if this type of control is suitable for the given endpoint info */
    static canBeUsedFor(endpointInfo: any): any;
    /** @private */
    private static hasTextOptions;
    /** @private */
    private static isExplicitlyDiscrete;
    /** @private */
    private static getCSS;
    constructor(patchConnection: any, endpointInfo: any);
    setEndpoint(patchConnection: any, endpointInfo: any): void;
    options: any;
    toIndex: ((value: any) => number) | undefined;
    select: HTMLSelectElement | undefined;
    selectedIndex: number | undefined;
    /** Returns a string version of the given value */
    getDisplayValue(v: any): any;
}
/** A control which wraps a child control, adding a label and value display box below it */
export class LabelledControlHolder extends ParameterControlBase {
    /** @private */
    private static getCSS;
    constructor(patchConnection: any, endpointInfo: any, childControl: any);
    childControl: any;
    setEndpoint(patchConnection: any, endpointInfo: any): void;
    valueText: HTMLDivElement | undefined;
}
import { PatchConnection } from "./cmaj-patch-connection.js";
