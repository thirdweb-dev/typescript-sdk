import fetch from "node-fetch";

export * from "./core";
export * from "./contracts";
export * from "./types";
export * from "./common";
export * from "./core/classes";
export type { ContractType, NetworkOrSignerOrProvider } from "./core/types";
export type {
  NFTMetadataInput,
  NFTMetadataOwner,
  NFTMetadata,
} from "./schema/tokens/common";
export * from "./schema/tokens/edition";

export type { Role } from "./common/role";
export * from "./core/classes/ipfs-storage";
export { CommonContractSchema } from "./schema/contracts/common";
export * from "./schema/contracts/common/claim-conditions";
export * from "./schema/tokens/common/properties";
export * from "./constants/chains";
export * from "./schema/tokens/token";
export * from "./schema/tokens/edition";
export * from "./schema/contracts/common";
export type { SDKOptions } from "./schema/sdk-options";

if (!globalThis.fetch) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.fetch = fetch;
}
