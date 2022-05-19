import { SignerOrProvider } from "../core/types";
import { ethers, providers, Signer } from "ethers";
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
  | `https://${string}`;

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
    console.warn(
      "Passing a signer or provider to the ThirdwebSDK is deprecated, use `sdk.wallet.connect()` instead.",
    );
    return Signer.isSigner(network)
      ? network.provider || ethers.getDefaultProvider()
      : network;
  }
  let rpcUrl: string;
  switch (network) {
    case "mumbai":
      rpcUrl = `https://polygon-mumbai.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
      break;
    case "rinkeby":
      rpcUrl = `https://eth-rinkeby.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
      break;
    case "goerli":
      rpcUrl = `https://eth-goerli.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
      break;
    case "polygon":
      rpcUrl = `https://polygon-mainnet.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
      break;
    case "mainnet":
      rpcUrl = `https://eth-mainnet.g.alchemy.com/v2/${DEFAULT_API_KEY}`;
      break;
    case "fantom":
      rpcUrl = "https://rpc.ftm.tools";
      break;
    case "avalanche":
      rpcUrl = "https://rpc.ankr.com/avalanche";
      break;
    default:
      if (network.startsWith("http")) {
        rpcUrl = network;
      } else {
        throw new Error(`Unrecognized chain name or RPC url: ${network}`);
      }
  }
  return getReadOnlyProvider(rpcUrl);
}

/**
 * @internal
 * @param network
 * @param chainId
 */
function getReadOnlyProvider(network: string, chainId?: number) {
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
