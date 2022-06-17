import { ethers, providers } from "ethers";
import { SignerOrProvider } from "../core/types";
import { Provider } from "@ethersproject/providers";
import { ChainId, SUPPORTED_CHAIN_ID } from "./chains";
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
  // common alias for `polygon`
  | "matic"
  | "rinkeby"
  | "goerli"
  | "mainnet"
  // common alias for `mainnet`
  | "ethereum"
  | "fantom"
  | "avalanche"
  | "optimism"
  | "optimism-testnet"
  | "arbitrum"
  | "arbitrum-testnet"
  // ideally we could use `https://${string}` notation here, but doing that causes anything that is a generic string to throw a type error => not worth the hassle for now
  | (string & {})
  | (number & {});

export const chainNameToId: Record<string, number> = {
  mumbai: ChainId.Mumbai,
  rinkeby: ChainId.Rinkeby,
  goerli: ChainId.Goerli,
  polygon: ChainId.Polygon,
  mainnet: ChainId.Mainnet,
  optimism: ChainId.Optimism,
  "optimism-testnet": ChainId.OptimismTestnet,
  arbitrum: ChainId.Arbitrum,
  "arbitrum-testnet": ChainId.ArbitrumTestnet,
  fantom: ChainId.Fantom,
  avalanche: ChainId.Avalanche,
};

/**
 * @internal
 * This is a community API key that is subject to rate limiting. Please use your own key.
 */
const DEFAULT_API_KEY = "_gg7wSSi0KMBsdKnGVfHDueq6xMB9EkC";

export const defaultRPCMap: Record<SUPPORTED_CHAIN_ID, string> = {
  [ChainId.Polygon]: `https://polygon-mainnet.g.alchemy.com/v2/${DEFAULT_API_KEY}`,
  [ChainId.Mumbai]: `https://polygon-mumbai.g.alchemy.com/v2/${DEFAULT_API_KEY}`,
  [ChainId.Mainnet]: `https://eth-mainnet.g.alchemy.com/v2/${DEFAULT_API_KEY}`,
  [ChainId.Rinkeby]: `https://eth-rinkeby.g.alchemy.com/v2/${DEFAULT_API_KEY}`,
  [ChainId.Goerli]: `https://eth-goerli.g.alchemy.com/v2/${DEFAULT_API_KEY}`,
  [ChainId.Optimism]: `https://opt-mainnet.g.alchemy.com/v2/${DEFAULT_API_KEY}`,
  [ChainId.OptimismTestnet]: "https://kovan.optimism.io",
  [ChainId.Arbitrum]: `https://arb-mainnet.g.alchemy.com/v2/${DEFAULT_API_KEY}`,
  [ChainId.ArbitrumTestnet]: `https://arb-rinkeby.g.alchemy.com/v2/${DEFAULT_API_KEY}`,
  [ChainId.Fantom]: "https://rpc.ftm.tools",
  [ChainId.FantomTestnet]: "https://rpc.testnet.fantom.network",
  [ChainId.Avalanche]: "https://rpc.ankr.com/avalanche",
  [ChainId.AvalancheFujiTestnet]: "https://api.avax-test.network/ext/bc/C/rpc",
};

/**
 * @internal
 * @param network
 * @param customRpcMap
 */
export function getRpcUrl(
  network: ChainOrRpc,
  customRpcMap?: Record<number, string>,
): string {
  if (
    typeof network === "string" &&
    (network.startsWith("http") || network.startsWith("ws"))
  ) {
    return network;
  }
  const chainId: number =
    typeof network === "string" ? chainNameToId[network] : network;
  const fullRpcMap: Record<number, string> = {
    ...defaultRPCMap,
    ...customRpcMap,
  };
  if (chainId in fullRpcMap) {
    return fullRpcMap[chainId];
  }
  throw new Error(`Unrecognized chain name or RPC url: ${network}`);
}

/**
 * @internal
 * @param network - the chain name or rpc url
 * @returns the rpc url for that chain
 */
export function getProviderForChain(network: ChainOrRpc | Provider): Provider {
  if (typeof network !== "string" && typeof network !== "number") {
    return network;
  }
  const rpcUrl = getRpcUrl(network);
  return getReadOnlyProvider(rpcUrl);
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
