import { AddressZero } from "@ethersproject/constants";
import { ChainId, SUPPORTED_CHAIN_ID } from "./chains";

/**
 * @internal
 */
export const FORWARDER_ADDRESS = "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81";

const TWRegistry_testnet = "0x8B6B22F212A8265e694171bec4089AD1DAd68792";
const TWFactory_testnet = "0xf0aa8AE97efA32cc6d9dDcF4a08F0C95802Ec039";

/**
 * @internal
 */
export const CONTRACT_ADDRESSES: Record<
  SUPPORTED_CHAIN_ID,
  {
    biconomyForwarder: string;
    twFactory: string;
    twRegistry: string;
  }
> = {
  [ChainId.Mainnet]: {
    biconomyForwarder: "0x84a0856b038eaAd1cC7E297cF34A7e72685A8693",
    twFactory: AddressZero,
    twRegistry: AddressZero,
  },
  [ChainId.Rinkeby]: {
    biconomyForwarder: "0xFD4973FeB2031D4409fB57afEE5dF2051b171104",
    twFactory: TWFactory_testnet,
    twRegistry: TWRegistry_testnet,
  },
  [ChainId.Goerli]: {
    biconomyForwarder: AddressZero,
    twFactory: TWFactory_testnet,
    twRegistry: TWRegistry_testnet,
  },
  [ChainId.Polygon]: {
    biconomyForwarder: "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8",
    twFactory: AddressZero,
    twRegistry: AddressZero,
  },
  [ChainId.Mumbai]: {
    biconomyForwarder: "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b",
    twFactory: TWFactory_testnet,
    twRegistry: TWRegistry_testnet,
  },
  [ChainId.Avalanche]: {
    biconomyForwarder: "0x64CD353384109423a966dCd3Aa30D884C9b2E057",
    twFactory: AddressZero,
    twRegistry: AddressZero,
  },
  [ChainId.AvalancheFujiTestnet]: {
    biconomyForwarder: "0x6271Ca63D30507f2Dcbf99B52787032506D75BBF",
    twFactory: AddressZero,
    twRegistry: AddressZero,
  },
  [ChainId.Fantom]: {
    biconomyForwarder: AddressZero,
    twFactory: AddressZero,
    twRegistry: AddressZero,
  },
  [ChainId.FantomTestnet]: {
    biconomyForwarder: AddressZero,
    twFactory: AddressZero,
    twRegistry: AddressZero,
  },
};

/**
 * @internal
 */
export function getContractAddressByChainId(
  chainId: SUPPORTED_CHAIN_ID | ChainId.Hardhat,
  contractName: keyof typeof CONTRACT_ADDRESSES[SUPPORTED_CHAIN_ID],
): string {
  // for testing only
  if (chainId === ChainId.Hardhat) {
    if (contractName === "twFactory") {
      return process.env.factoryAddress as string;
    } else if (contractName === "twRegistry") {
      return process.env.registryAddress as string;
    } else {
      return AddressZero;
    }
  }
  // real output here
  return CONTRACT_ADDRESSES[chainId][contractName];
}
