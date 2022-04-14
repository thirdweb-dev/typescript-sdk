import { AddressZero } from "@ethersproject/constants";
import { ChainId, SUPPORTED_CHAIN_ID } from "./chains";

/**
 * @internal
 */
export const OZ_DEFENDER_FORWARDER_ADDRESS =
  "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81";

// FIXME STOPSHIP - finalize these addresses before merging to main
// const TWRegistry_address_default = "0x7c487845f98938Bb955B1D5AD069d9a30e4131fd";
const TWRegistry_address = "0x3F17972CB27506eb4a6a3D59659e0B57a43fd16C"; // byoc TWregistru
const TWFactory_address = "0x11c34F062Cb10a20B9F463E12Ff9dA62D76FDf65";
const BYOCRegistry_address = "0x61Bb02795b4fF5248169A54D9f149C4557B0B7de"; // TODO finalize, this is mumbai only
const BYOCFactory_address = "0x3c3D901Acb5f7746dCf06B26fCe881d21970d2B6";

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
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
  },
  [ChainId.Rinkeby]: {
    biconomyForwarder: "0xFD4973FeB2031D4409fB57afEE5dF2051b171104",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
  },
  [ChainId.Goerli]: {
    biconomyForwarder: AddressZero,
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
  },
  [ChainId.Polygon]: {
    biconomyForwarder: "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
  },
  [ChainId.Mumbai]: {
    biconomyForwarder: "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
  },
  [ChainId.Avalanche]: {
    biconomyForwarder: "0x64CD353384109423a966dCd3Aa30D884C9b2E057",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
  },
  [ChainId.AvalancheFujiTestnet]: {
    biconomyForwarder: "0x6271Ca63D30507f2Dcbf99B52787032506D75BBF",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
  },
  [ChainId.Fantom]: {
    biconomyForwarder: AddressZero,
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
  },
  [ChainId.FantomTestnet]: {
    biconomyForwarder: AddressZero,
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
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

/**
 * @internal
 */
export function getBYOCRegistryAddress() {
  if (process.env.byocRegistryAddress) {
    return process.env.byocRegistryAddress as string;
  } else {
    return BYOCRegistry_address;
  }
}

/**
 * @internal
 */
export function getBYOCFactoryAddress() {
  if (process.env.byocFactoryAddress) {
    return process.env.byocFactoryAddress as string;
  } else {
    return BYOCFactory_address;
  }
}
