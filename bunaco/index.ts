import './dist/codicon.ttf' with { type: 'file' };
import monaco from './dist';
import jsonWorker from './dist/workers/monaco.json.worker.js' with { type: 'file' };
import cssWorker from './dist/workers/monaco.css.worker.js' with { type: 'file' };
import htmlWorker from './dist/workers/monaco.html.worker.js' with { type: 'file' };
import tsWorker from './dist/workers/monaco.ts.worker.js' with { type: 'file' };
import editorWorker from './dist/workers/monaco.editor.worker.js' with { type: 'file' };
self.MonacoEnvironment = {
	getWorkerUrl: (_moduleId, label) => {
		switch (label) {
			case 'json': return new URL(jsonWorker, import.meta.url).href;
			case 'css': case 'scss': case 'less': return new URL(cssWorker, import.meta.url).href;
			case 'html': case 'handlebars': case 'razor': return new URL(htmlWorker, import.meta.url).href;
			case 'typescript': case 'javascript': return new URL(tsWorker, import.meta.url).href;
		}
		console.log('monaco', editorWorker, import.meta.url, new URL(editorWorker, import.meta.url).href);
		return new URL(editorWorker, import.meta.url).href;
	}
};
export default monaco;