import fetch from "node-fetch";

export * from "./collection";
export * from "./common";
export * from "./control";
export * from "./core";
export * from "./core/types";
export * from "./currency";
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
