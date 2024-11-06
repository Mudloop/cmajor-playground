/**
 *   This class can be given a URL or some source file content for a Cmajor patch, and will
 *   compile a javascript/WASM object from i
 */
export default class CmajorCompiler {
    CmajorVersion: string;
    baseURL: string;
    sources: any[];
    /** Sets a base URL and the relative path from this to a the .cmajorpatch manifest file
     *  of the patch that you'd like to compile.
     *  @param {URL} baseURL - The base URL for the patch folder
     *  @param {string} manifestPath - The relative path of the .cmajorpatch file from the base URL
     */
    setManifestURL(baseURL: URL, manifestPath: string): void;
    readPatchFile: ((path: any) => Promise<Uint8Array>) | undefined;
    manifestPath: string | undefined;
    /** Manually adds a source file at a given path from the root of the patch. If you
     *  use setManifestURL() then you don't need to call this, but to load a patch from
     *  memory, you can also call this to give it all the files it might need before building.
     *  @param {string} path - The path to this file, relative to the root of the patch
     *  @param {(string|Uint8Array)} content - The content of the file - either a string or a UInt8Array
     */
    addSourceFile(path: string, content: (string | Uint8Array)): void;
    /** Attempts to build the patch, and returns an AudioWorkletNodePatchConnection object
     *  to control it if it succeeds.
     *  @param {AudioContext} audioContext - a web audio AudioContext object
     *  @param {string} workletName - the name to give the new worklet that is created
     */
    /** Attempts to build and return the Cmajor patch class as a javascript object. */
    createJavascriptWrapperClass(): Promise<any>;
    /** Attempts to compile the patch into its javascript/WASM form, returning the
     *  resultant code as a string if it succeeds.
     */
    createJavascriptCode(): Promise<any>;
    /** Tries to read and return the content of a file. */
    getSourceFileContent(path: any): Promise<any>;
    /** Tries to read and return the content of a file as a string. */
    getSourceFileContentAsString(path: any): Promise<string>;
    /** Tries to read and return the manifest as a JSON object. */
    readManifest(): Promise<any>;
    /** @private */
    private addKnownFilesFromManifest;
}