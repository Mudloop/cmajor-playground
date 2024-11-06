/** Returns a list of types of view that can be created for this patch.
 */
export function getAvailableViewTypes(patchConnection: any): string[];
/** Creates and returns a HTMLElement view which can be shown to control this patch.
 *
 *  If no preferredType argument is supplied, this will return either a custom patch-specific
 *  view (if the manifest specifies one), or a generic view if not. The preferredType argument
 *  can be used to choose one of the types of view returned by getAvailableViewTypes().
 *
 *  @param {PatchConnection} patchConnection - the connection to use
 *  @param {string} preferredType - the name of the type of view to open, e.g. "generic"
 *                                  or the name of one of the views in the manifest
 *  @returns {HTMLElement} a HTMLElement that can be displayed as the patch GUI
 */
export function createPatchView(patchConnection: PatchConnection, preferredType: string): HTMLElement;
/** If a patch view declares itself to be scalable, this will attempt to scale it to fit
 *  into a given parent element.
 *
 *  @param {HTMLElement} view - the patch view
 *  @param {HTMLElement} parentToScale - the patch view's direct parent element, to which
 *                                       the scale factor will be applied
 *  @param {HTMLElement} parentContainerToFitTo - an outer parent of the view, whose bounds
 *                                                the view will be made to fit
 */
export function scalePatchViewToFit(view: HTMLElement, parentToScale: HTMLElement, parentContainerToFitTo: HTMLElement): void;
/** Creates and returns a HTMLElement view which can be shown to control this patch.
 *
 *  Unlike createPatchView(), this will return a holder element that handles scaling
 *  and resizing, and which follows changes to the size of the parent that you
 *  append it to.
 *
 *  If no preferredType argument is supplied, this will return either a custom patch-specific
 *  view (if the manifest specifies one), or a generic view if not. The preferredType argument
 *  can be used to choose one of the types of view returned by getAvailableViewTypes().
 *
 *  @param {PatchConnection} patchConnection - the connection to use
 *  @param {string} preferredType - the name of the type of view to open, e.g. "generic"
 *                                  or the name of one of the views in the manifest
 *  @returns {HTMLElement} a HTMLElement that can be displayed as the patch GUI
 */
export function createPatchViewHolder(patchConnection: PatchConnection, preferredType?: string): HTMLElement | Promise<HTMLElement>;
import { PatchConnection } from "./cmaj-patch-connection.js";
