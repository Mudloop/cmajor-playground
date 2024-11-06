import type { BunPlugin } from "bun";

export const myPlugin: BunPlugin = {
  name: "Custom loader",
  setup(build) {
    console.log(build);
    // implementation
  },
};