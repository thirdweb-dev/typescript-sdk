import { ChainId, SUPPORTED_CHAIN_ID } from "./chain";
import { Currency } from "./currency";

export interface NativeToken extends Currency {
  wrapped: {
    address: string;
    name: string;
    symbol: string;
  };
}

export const FORWARDER_ADDRESS = "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81";
export const CONTRACT_ADDRESSES: Record<
  SUPPORTED_CHAIN_ID | ChainId.Hardhat,
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
  [ChainId.Hardhat]: {
    registry: "0x902a29f2cfe9f8580ad672AaAD7E917d85ca9a2E",
  },
};

const NATIVE_TOKENS: Record<SUPPORTED_CHAIN_ID | ChainId.Hardhat, NativeToken> =
  {
    [ChainId.Mainnet]: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      wrapped: {
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        name: "Wrapped Ether",
        symbol: "WETH",
      },
    },
    [ChainId.Rinkeby]: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      wrapped: {
        address: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
        name: "Wrapped Ether",
        symbol: "WETH",
      },
    },
    [ChainId.Polygon]: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
      wrapped: {
        address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        name: "Wrapped Matic",
        symbol: "WMATIC",
      },
    },
    [ChainId.Mumbai]: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
      wrapped: {
        address: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
        name: "Wrapped Matic",
        symbol: "WMATIC",
      },
    },
    [ChainId.Avalanche]: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
      wrapped: {
        address: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
        name: "Wrapped AVAX",
        symbol: "WAVAX",
      },
    },
    [ChainId.AvalancheFujiTestnet]: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
      wrapped: {
        address: "0xd00ae08403B9bbb9124bB305C09058E32C39A48c",
        name: "Wrapped AVAX",
        symbol: "WAVAX",
      },
    },
    [ChainId.Fantom]: {
      name: "Fantom",
      symbol: "FTM",
      decimals: 18,
      wrapped: {
        address: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",
        name: "Wrapped Fantom",
        symbol: "WFTM",
      },
    },
    [ChainId.FantomTestnet]: {
      name: "Fantom",
      symbol: "FTM",
      decimals: 18,
      wrapped: {
        address: "0xf1277d1Ed8AD466beddF92ef448A132661956621",
        name: "Wrapped Fantom",
        symbol: "WFTM",
      },
    },
    [ChainId.Hardhat]: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
      wrapped: {
        address: "0xc778417E063141139Fce010982780140Aa0cD5Ab",
        name: "Wrapped Ether",
        symbol: "WETH",
      },
    },
  };

export function getContractAddressByChainId(
  chainId: ChainId,
): string | undefined {
  return CONTRACT_ADDRESSES[chainId as SUPPORTED_CHAIN_ID]["registry"];
}

export function getNativeTokenByChainId(chainId: ChainId): NativeToken {
  return NATIVE_TOKENS[chainId as SUPPORTED_CHAIN_ID];
}
