import { ethers, providers } from "ethers";
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
export type ChainIdOrName =
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
  | "avalanche-testnet"
  | "optimism"
  | "optimism-testnet"
  | "arbitrum"
  | "arbitrum-testnet"
  | ChainId
  | (number & {});

/**
 * @internal
 */
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

/**
 * @internal
 */
export const defaultRPCMap: Record<
  SUPPORTED_CHAIN_ID | ChainId.Hardhat | ChainId.Localhost,
  string
> = {
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
  [ChainId.Hardhat]: "http://localhost:8545",
  [ChainId.Localhost]: "http://localhost:8545",
};

/**
 * @internal
 * @param chain
 */
export function toChainId(chain: ChainIdOrName) {
  return typeof chain === "string" ? chainNameToId[chain] : chain;
}

/**
 * @internal
 * @param chainId
 * @param customRpcMap
 */
export function getRpcUrl(
  chainId: number,
  customRpcMap?: Record<number, string>,
): string {
  const fullRpcMap: Record<number, string> = {
    ...defaultRPCMap,
    ...customRpcMap,
  };
  if (chainId in fullRpcMap) {
    return fullRpcMap[chainId];
  }
  throw new Error(`Unrecognized chain name or RPC url: ${chainId}.`);
}

/**
 * @internal
 * @param chainId
 * @param customRpcMap
 * @returns the rpc url for that chain
 */
export function getProviderForChain(
  chainId: number,
  customRpcMap?: Record<number, string>,
): Provider {
  const rpcUrl = getRpcUrl(chainId, customRpcMap);
  return getReadOnlyProvider(rpcUrl, chainId);
}

/**
 *
 * @param network - the chain name or rpc url
 * @param chainId - the optional chain id
 * @returns the provider
 */
export function getReadOnlyProvider(network: string, chainId: number) {
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
