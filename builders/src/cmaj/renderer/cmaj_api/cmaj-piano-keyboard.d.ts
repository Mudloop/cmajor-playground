/**
 *  An general-purpose on-screen piano keyboard component that allows clicks or
 *  key-presses to be used to play things.
 *
 *  To receive events, you can attach "note-down" and "note-up" event listeners via
 *  the standard HTMLElement/EventTarget event system, e.g.
 *
 *  myKeyboardElement.addEventListener("note-down", (note) => { ...handle note on... });
 *  myKeyboardElement.addEventListener("note-up",   (note) => { ...handle note off... });
 *
 *  The `note` object will contain a `note` property with the MIDI note number.
 *  (And obviously you can remove them with removeEventListener)
 *
 *  Or, if you're connecting the keyboard to a PatchConnection, you can use the helper
 *  method attachToPatchConnection() to create and attach some suitable listeners.
 *
 */
export default class PianoKeyboard extends HTMLElement {
    static get observedAttributes(): string[];
    constructor({ naturalNoteWidth, accidentalWidth, accidentalPercentageHeight, naturalNoteBorder, accidentalNoteBorder, pressedNoteColour }?: {});
    naturalWidth: any;
    accidentalWidth: any;
    accidentalPercentageHeight: any;
    naturalBorder: any;
    accidentalBorder: any;
    pressedColour: any;
    root: ShadowRoot;
    currentDraggedNote: number;
    currentExternalNotesOn: Set<any>;
    currentKeyboardNotes: Set<any>;
    currentPlayedNotes: Set<any>;
    currentDisplayedNotes: Set<any>;
    notes: any[];
    modifierKeys: number;
    currentTouches: Map<any, any>;
    get config(): {
        rootNote: number;
        numNotes: number;
        keymap: string;
    };
    /** This attaches suitable listeners to make this keyboard control the given MIDI
     *  endpoint of a PatchConnection object. Use detachPatchConnection() to remove
     *  a connection later on.
     *
     *  @param {PatchConnection} patchConnection
     *  @param {string} midiInputEndpointID
     */
    attachToPatchConnection(patchConnection: PatchConnection, midiInputEndpointID: string): void;
    callbacks: Map<any, any> | undefined;
    /** This removes the connection to a PatchConnection object that was previously attached
     *  with attachToPatchConnection().
     *
     *  @param {PatchConnection} patchConnection
     */
    detachPatchConnection(patchConnection: PatchConnection): void;
    /** Can be overridden to return the color to use for a note index */
    getNoteColour(note: any): undefined;
    /** Can be overridden to return the text label to draw on a note index */
    getNoteLabel(note: any): string;
    /** Clients should call this to deliver a MIDI message, which the keyboard will use to
     *  highlight the notes that are currently playing.
     */
    handleExternalMIDI(message: any): void;
    /** This method will be called when the user plays a note. The default behaviour is
     *  to dispath an event, but you could override this if you needed to.
    */
    sendNoteOn(note: any): void;
    /** This method will be called when the user releases a note. The default behaviour is
     *  to dispath an event, but you could override this if you needed to.
    */
    sendNoteOff(note: any): void;
    /** Clients can call this to force all the notes to turn off, e.g. in a "panic". */
    allNotesOff(): void;
    setDraggedNote(newNote: any): void;
    addKeyboardNote(note: any): void;
    removeKeyboardNote(note: any): void;
    isNoteActive(note: any): boolean;
    /** @private */
    private touchEnd;
    /** @private */
    private touchStart;
    /** @private */
    private handleMouse;
    isDragging: boolean | undefined;
    /** @private */
    private handleKey;
    /** @private */
    private refreshHTML;
    /** @private */
    private refreshActiveNoteElements;
    /** @private */
    private getAccidentalOffset;
    /** @private */
    private getNoteElements;
    /** @private */
    private getCSS;
}
