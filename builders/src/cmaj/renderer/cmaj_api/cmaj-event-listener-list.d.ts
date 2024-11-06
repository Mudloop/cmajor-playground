/** This event listener management class allows listeners to be attached and
 *  removed from named event types.
 */
export class EventListenerList {
    listenersPerType: {};
    /** Adds a listener for a specifc event type.
     *  If the listener is already registered, this will simply add it again.
     *  Each call to addEventListener() must be paired with a removeventListener()
     *  call to remove it.
     *
     *  @param {string} type
     */
    addEventListener(type: string, listener: any): void;
    /** Removes a listener that was previously added for the given event type.
     *  @param {string} type
     */
    removeEventListener(type: string, listener: any): void;
    /** Attaches a callback function that will be automatically unregistered
     *  the first time it is invoked.
     *
     *  @param {string} type
     */
    addSingleUseListener(type: string, listener: any): void;
    /** Synchronously dispatches an event object to all listeners
     *  that are registered for the given type.
     *
     *  @param {string} type
     */
    dispatchEvent(type: string, event: any): void;
    /** Returns the number of listeners that are currently registered
     *  for the given type of event.
     *
     *  @param {string} type
     */
    getNumListenersForType(type: string): any;
}
