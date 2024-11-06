import { myPlugin } from "./myPlugin";
Bun.build({
	entrypoints: ["./app.ts"],
	outdir: "./out",
	plugins: [myPlugin],
});