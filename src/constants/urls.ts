import { ethers, providers } from "ethers";
import { SignerOrProvider } from "../core/types";
/**
 * @internal
 */
export const DEFAULT_IPFS_GATEWAY = "https://gateway.ipfscdn.io/ipfs/";
/**
 * @internal
 */
export const PUBLIC_GATEWAYS = [
  "https://gateway.ipfscdn.io/ipfs/",
  "https://gateway2.ipfscdn.io/ipfs/",
];

/**
 * @internal
 */
export const TW_IPFS_SERVER_URL = "https://upload.nftlabs.co";
/**
 * @internal
 */
export const PINATA_IPFS_URL = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

/**
 * @internal
 */
export type ChainOrRpc =
  | "mumbai"
  | "polygon"
  | "rinkeby"
  | "goerli"
  | "mainnet"
  | "fantom"
  | "avalanche"
  // ideally we could use `https://${string}` notation here, but doing that causes anything that is a generic string to throw a type error => not worth the hassle for now
  | (string & {});

/**
 * @internal
 * This is a community API key that is subject to rate limiting. Please use your own key.
 */
const DEFAULT_API_KEY = "_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC";

/**
 * @internal
 * @param network - the chain name or rpc url
 * @returns the rpc url for that chain
 */
export function getProviderForNetwork(network: ChainOrRpc | SignerOrProvider) {
  if (typeof network !== "string") {
    // console.warn(
    //   "Passing a signer or provider to the ThirdwebSDK is deprecated, use `sdk.wallet.connect()` instead.",
    // );
    return network;
  }
  switch (network) {
    case "mumbai":
      return `https://polygon-mumbai.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
    case "rinkeby":
      return `https://eth-rinkeby.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
    case "goerli":
      return `https://eth-goerli.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
    case "polygon":
      return `https://polygon-mainnet.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
    case "mainnet":
      return `https://eth-mainnet.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
    case "fantom":
      return "https://rpc.ftm.tools";
    case "avalanche":
      return "https://rpc.ankr.com/avalanche";
    default:
      if (network.startsWith("http")) {
        return network;
      } else {
        throw new Error(`Unrecognized chain name or RPC url: ${network}`);
      }
  }
}

/**
 *
 * @param network - the chain name or rpc url
 * @param chainId - the optional chain id
 * @returns the provider
 */
export function getReadOnlyProvider(network: string, chainId?: number) {
  try {
    const match = network.match(/^(ws|http)s?:/i);
    // try the JSON batch provider if available
    if (match) {
      switch (match[1]) {
        case "http":
          return new providers.JsonRpcBatchProvider(network, chainId);
        case "ws":
          return new providers.WebSocketProvider(network, chainId);
        default:
          return ethers.getDefaultProvider(network);
      }
    } else {
      return ethers.getDefaultProvider(network);
    }
  } catch (e) {
    // fallback to the default provider
    return ethers.getDefaultProvider(network);
  }
}
