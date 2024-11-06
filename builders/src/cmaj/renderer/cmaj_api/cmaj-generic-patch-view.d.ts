/** Creates a generic view element which can be used to control any patch.
 *  @param {PatchConnection} patchConnection - the connection to the target patch
 */
export default function createPatchView(patchConnection: PatchConnection): GenericPatchView;
/** A simple, generic view which can control any type of patch */
declare class GenericPatchView extends HTMLElement {
    /** Creates a view for a patch.
     *  @param {PatchConnection} patchConnection - the connection to the target patch
     */
    constructor(patchConnection: PatchConnection);
    patchConnection: PatchConnection;
    statusListener: (status: any) => void;
    status: any;
    titleElement: HTMLElement | null;
    parametersElement: HTMLElement | null;
    /** This is picked up by some of our wrapper code to know whether it makes
     *  sense to put a title bar/logo above the GUI.
     */
    hasOwnTitleBar(): boolean;
    /** @private */
    private connectedCallback;
    /** @private */
    private disconnectedCallback;
    /** @private */
    private createControlElements;
    /** @private */
    private getHTML;
}
export {};
