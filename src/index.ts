import { NFTLabsSDK } from "./core";
import fetch from "node-fetch";

if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = fetch;
}

export default NFTLabsSDK;
