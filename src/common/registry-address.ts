import { ChainId, SUPPORTED_CHAIN_ID } from "./chain";

export const CONTRACT_ADDRESSES: Record<
  SUPPORTED_CHAIN_ID,
  Record<"registry", string>
> = {
  [ChainId.Rinkeby]: {
    registry: "0x3C8F6678b36291DDca275352D7413487C3Db2e20",
  },
  [ChainId.Polygon]: {
    registry: "0x3C8F6678b36291DDca275352D7413487C3Db2e20",
  },
  [ChainId.Mumbai]: {
    registry: "0x3C8F6678b36291DDca275352D7413487C3Db2e20",
  },
  [ChainId.Avalanche]: {
    registry: "0x3C8F6678b36291DDca275352D7413487C3Db2e20",
  },
  [ChainId.AvalancheFujiTestnet]: {
    registry: "0x3C8F6678b36291DDca275352D7413487C3Db2e20",
  },
  [ChainId.Fantom]: {
    registry: "0x3C8F6678b36291DDca275352D7413487C3Db2e20",
  },
  [ChainId.FantomTestnet]: {
    registry: "0x3C8F6678b36291DDca275352D7413487C3Db2e20",
  },
};

export function getContractAddressByChainId(
  chainId: ChainId,
): string | undefined {
  return CONTRACT_ADDRESSES[chainId as SUPPORTED_CHAIN_ID]["registry"];
}
