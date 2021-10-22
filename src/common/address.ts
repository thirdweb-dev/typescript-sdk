import { ChainId, SUPPORTED_CHAIN_ID } from "./chain";

export const FORWARDER_ADDRESS = "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81";
export const CONTRACT_ADDRESSES: Record<
  SUPPORTED_CHAIN_ID,
  Record<"registry", string>
> = {
  [ChainId.Mainnet]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
  [ChainId.Rinkeby]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
  [ChainId.Polygon]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
  [ChainId.Mumbai]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
  [ChainId.Avalanche]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
  [ChainId.AvalancheFujiTestnet]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
  [ChainId.Fantom]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
  [ChainId.FantomTestnet]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
};

export function getContractAddressByChainId(
  chainId: ChainId,
): string | undefined {
  return CONTRACT_ADDRESSES[chainId as SUPPORTED_CHAIN_ID]["registry"];
}
