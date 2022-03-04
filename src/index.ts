import "cross-fetch/polyfill";

/**
 * The {@link https://thirdweb.com | thirdweb} typescript sdk.
 *
 * @remarks
 * Please keep in mind that the thirdweb typescript sdk and {@link https://thirdweb.com/dashboard | Admin Dashboard} are currently in Early Access.
 *
 * Should you find bugs or in the case you need help please reach out to us in {@link https://discord.gg/thirdweb | Discord}. (We also have 🍪 )
 *
 *
 * @example
 * To get you started here's how you would instantiate the SDK and fetch some NFTs
 *
 * 1. Install the sdk
 * ```shell
 * npm install @thirdweb-dev/sdk
 * ```
 *
 * 2. Get your NFT contract address from the {@link https://thirdweb.com/dashboard | Admin Dashboard}.
 *
 * 3. Write the tiniest amount of code!
 * ```typescript
 * import { ThirdwebSDK } from "@thirdweb-dev/sdk";
 *
 * const sdk = new ThirdwebSDK(provider);
 * const contractAddress = "0x..."; // your contract address from step 2
 * const nftContract = sdk.getNFTCollection(contractAddress);
 *
 *  const nftListWithOwnerAddress = await nftContract.getAllWithOwner();
 *  console.log(nftListWithOwnerAddress);
 * ```
 * ```
 * Output
 * => [
 *       {
 *          owner: "0x...",
 *          metadata: {
 *            name: "...",
 *            description: "...",
 *            image: "..."
 *          },
 *       },
 *       {
 *          owner: "0x...",
 *          metadata: {
 *            name: "...",
 *            description: "...",
 *            image: "..."
 *          },
 *       },
 *       ...
 *    ]
 * ```
 *
 * @packageDocumentation
 */
export * from "./core";
export * from "./core/classes";
export * from "./types";
export * from "./enums";
export * from "./common";
export * from "./constants";
export * from "./contracts";
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
export type { SDKOptions, SDKOptionsSchema } from "./schema/sdk-options";
