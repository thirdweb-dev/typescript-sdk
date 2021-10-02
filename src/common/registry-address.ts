import { ChainId, SUPPORTED_CHAIN_ID } from "./chain";

export const CONTRACT_ADDRESSES: Record<
  SUPPORTED_CHAIN_ID,
  Record<"registry", string>
> = {
  [ChainId.Rinkeby]: {
    registry: "0x8e189fbc1babbcd5bb5c960967b34be73867e742",
  },
  [ChainId.Polygon]: {
    registry: "0x8e189fbC1BAbbCd5bb5c960967B34Be73867e742",
  },
  [ChainId.Mumbai]: {
    registry: "0x8e189fbC1BAbbCd5bb5c960967B34Be73867e742",
  },
};

export function getContractAddressByChainId(
  chainId: ChainId,
): string | undefined {
  return CONTRACT_ADDRESSES[chainId as SUPPORTED_CHAIN_ID]["registry"];
}
