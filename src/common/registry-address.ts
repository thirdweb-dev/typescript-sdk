import { ChainId, SUPPORTED_CHAIN_ID } from "./chain";

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
