import fetch from "node-fetch";

export * from "./app";
export * from "./collection";
export * from "./common";
export * from "./core";
export type { Module } from "./core/module";
export * from "./core/types";
export * from "./currency";
export * from "./datastore";
export * from "./drop";
export * from "./market";
export * from "./nft";
export * from "./pack";
export type { IAppModule } from "./registry";

if (!globalThis.fetch) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.fetch = fetch;
}
