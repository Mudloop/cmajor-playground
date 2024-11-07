import { LitElement } from 'lit';
import { RendererOptions } from '../core';

export * from './builder/CmajorBuilder';
export * from './renderer/CmajRenderer';

export interface RendererBase extends LitElement {
	init(options: RendererOptions): Promise<void>;
}