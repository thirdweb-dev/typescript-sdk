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
    registry: "0x06aD00C173012AAd5Eea4Ec5b3737fB6a6dFDDf6",
  },
  [ChainId.Mumbai]: {
    registry: "0x2e494c9dD341C2C5AA182145175fa666341F8B7f",
  },
};

export function getContractAddressByChainId(
  chainId: ChainId,
): string | undefined {
  return CONTRACT_ADDRESSES[chainId as SUPPORTED_CHAIN_ID]["registry"];
}
