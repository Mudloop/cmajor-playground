import { LitElement } from 'lit';

export * from './builder/CmajorBuilder';
export * from './renderer/CmajRenderer';

export interface BuildRenderer extends LitElement {
	init(ctx: AudioContext): Promise<void>;
}