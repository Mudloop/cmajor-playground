export const work = async<T>(src: string | URL, data: any): Promise<T> => {
	const url = src instanceof URL ? src : URL.createObjectURL(new Blob([src], { type: 'application/javascript' }));
	const worker = new Worker(url);
	try {
		return await new Promise((resolve, reject) => {
			worker.onmessage = (e) => e.data.error ? reject(e.data.error) : resolve(e.data);
			worker.postMessage(data);
		});
	} finally {
		worker.terminate();
		if (typeof url == 'string') URL.revokeObjectURL(url);
	}
}