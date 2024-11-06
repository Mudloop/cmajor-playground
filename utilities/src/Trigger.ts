export class Trigger<T = void> {
	private listeners: Set<(t: T) => void> = new Set();
	public add = (listener: (t: T) => void) => this.listeners.add(listener);
	public remove = (listener: (t: T) => void) => this.listeners.delete(listener);
	public trigger = (t: T) => this.listeners.forEach(listener => listener(t));
	public dispose = () => this.listeners.clear();
}