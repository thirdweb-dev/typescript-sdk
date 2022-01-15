import { ChainId, SUPPORTED_CHAIN_ID } from "../common/chain";

/**
 * Fallback map of default block mining times in seconds.

 */
export const DEFAULT_BLOCK_TIMES_FALLBACK: Record<
  SUPPORTED_CHAIN_ID | ChainId.Hardhat,
  { secondsBetweenBlocks: number; synced: boolean }
> = {
  [ChainId.Mainnet]: {
    secondsBetweenBlocks: 15,
    synced: false,
  },
  [ChainId.Rinkeby]: {
    secondsBetweenBlocks: 15,
    synced: false,
  },
  [ChainId.Polygon]: {
    secondsBetweenBlocks: 2.5,
    synced: false,
  },
  [ChainId.Mumbai]: {
    secondsBetweenBlocks: 2.5,
    synced: false,
  },
  [ChainId.Fantom]: {
    secondsBetweenBlocks: 1,
    synced: false,
  },
  [ChainId.FantomTestnet]: {
    secondsBetweenBlocks: 1,
    synced: false,
  },
  [ChainId.Avalanche]: {
    secondsBetweenBlocks: 1,
    synced: false,
  },
  [ChainId.AvalancheFujiTestnet]: {
    secondsBetweenBlocks: 1,
    synced: false,
  },
  [ChainId.Hardhat]: {
    secondsBetweenBlocks: 1,
    synced: false,
  },
};
