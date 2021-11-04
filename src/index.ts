import fetch from "node-fetch";

export * from "./common";
export * from "./core";
export type { Module, ModuleWithRoles } from "./core/module";
export type { IAppModule } from "./core/registry";
export * from "./core/types";
export * from "./modules";

if (!globalThis.fetch) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.fetch = fetch;
}
