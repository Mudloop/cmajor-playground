export type TransformRequest = { requestId: number; filename: string; contents: string; };
export type TransformResponse = { requestId: number; contents: string; };
export type TransformErrorResponse = { requestId?: number; description: string; line: number; column: number; };
export type ResponseMessage = { type: string; message?: TransformResponse | TransformErrorResponse; };
export type RequestMessage = { type: string; message: TransformRequest; };
declare function cmaj_sendMessageToServer(message: ResponseMessage): void;

import { hashString } from "@cmajor-playground/utilities";
import { FilesWithHashes } from "../../core";
const me = (globalThis as any);
me.window = globalThis;
self.onmessage = async function (event) {
	try {
		const files = event.data.files as FilesWithHashes;
		const url = event.data.url;
		const module = await import(url);
		const view = await new Promise<any>(resolve => {
			me.cmaj_sendMessageToServer = (message: ResponseMessage) => {
				if (message.type == 'ready') resolve(me.currentView);
			};
			module.default();
		});
		const resolvers: Map<number, (response: ResponseMessage) => void> = new Map;
		me.cmaj_sendMessageToServer = (response: ResponseMessage) => resolvers.get(response.message!.requestId!)?.(response);
		const result: FilesWithHashes = {}
		const promises = Object.entries(files).map(async ([path, file], index: number) => {
			if (typeof file.content == 'object') {
				result[path] = file;
				return;
			}
			const content = await new Promise<string>((resolve, reject) => {
				resolvers.set(index, response => {
					if (response.type == 'transformResponse') {
						resolve((response.message as TransformResponse).contents);
					} else {
						reject((response.message as TransformErrorResponse).description);
					}
				})
				view.deliverMessageFromServer({
					type: "transformRequest",
					message: {
						requestId: index,
						filename: path,
						contents: file.content
					}
				})
			});
			result[path] = {
				content,
				hash: await hashString(content)
			}
		})
		await Promise.all(promises);
		self.postMessage(result);
	} catch (e: any) {
		console.error(e);
		self.postMessage({ error: e });
	}
}