import { ContextManager } from '@cmajor-playground/utilities';
import { LitElement } from 'lit';

export * from './builder/CmajorBuilder';
export * from './renderer/CmajRenderer';

export interface BuildRenderer extends LitElement {
	init(contextManager: typeof ContextManager): Promise<void>;
}