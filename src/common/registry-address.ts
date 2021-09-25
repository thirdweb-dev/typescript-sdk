export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
  BSC = 56,
  xDai = 100,
  Polygon = 137,
  Moonriver = 1285,
  Mumbai = 80001,
  Harmony = 1666600000,
  Localhost = 1337,
  Hardhat = 31337,
}

export type SUPPORTED_CHAIN_ID = ChainId.Mumbai | ChainId.Polygon;

export const SUPPORTED_CHAIN_IDS: SUPPORTED_CHAIN_ID[] = [
  ChainId.Polygon,
  ChainId.Mumbai,
];

export const CONTRACT_ADDRESSES: Record<
  SUPPORTED_CHAIN_ID,
  Record<"registry", string>
> = {
  [ChainId.Polygon]: {
    registry: "0xf40Ab69F97AC674060D2506424E234D9e094E693",
  },
  [ChainId.Mumbai]: {
    registry: "0xAaf23C2043e5BFEb1092ed3411cc11f51039E996",
  },
};

export function getContractAddressByChainId(
  chainId: ChainId,
): string | undefined {
  return CONTRACT_ADDRESSES[chainId as SUPPORTED_CHAIN_ID]["registry"];
}
