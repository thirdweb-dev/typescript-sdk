import { constants } from "ethers";
import { ChainId, SUPPORTED_CHAIN_ID } from "./chains";

/**
 * @internal
 */
export const OZ_DEFENDER_FORWARDER_ADDRESS =
  "0xc82BbE41f2cF04e3a8efA18F7032BDD7f6d98a81";

const TWRegistry_address = "0x7c487845f98938Bb955B1D5AD069d9a30e4131fd";
const TWFactory_address = "0x5DBC7B840baa9daBcBe9D2492E45D7244B54A2A0";
const ContractPublisher_address = "0x1e474395f58418e9c594a79abb0152D04C229E8e"; // TODO finalize, this is

/**
 * @internal
 */
export const CONTRACT_ADDRESSES: Record<
  SUPPORTED_CHAIN_ID,
  {
    biconomyForwarder: string;
    twFactory: string;
    twRegistry: string;
    twBYOCRegistry: string;
    contractDeployer: string;
    contractMetadataRegistry: string;
    sigMint: string;
  }
> = {
  [ChainId.Mainnet]: {
    biconomyForwarder: "0x84a0856b038eaAd1cC7E297cF34A7e72685A8693",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
    twBYOCRegistry: constants.AddressZero,
    contractDeployer: constants.AddressZero,
    contractMetadataRegistry: constants.AddressZero,
    sigMint: constants.AddressZero,
  },
  [ChainId.Rinkeby]: {
    biconomyForwarder: "0xFD4973FeB2031D4409fB57afEE5dF2051b171104",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
    twBYOCRegistry: "0x3E6eE864f850F5e5A98bc950B68E181Cf4010F23",
    contractDeployer: "0xBD9fdebD651733e7EEAB8A83536D57023c3d3225",
    contractMetadataRegistry: "0x1e474395f58418e9c594a79abb0152D04C229E8e",
    sigMint: constants.AddressZero,
  },
  [ChainId.Goerli]: {
    biconomyForwarder: constants.AddressZero,
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
    twBYOCRegistry: "0xB1Bd9d7942A250BA2Dce27DD601F2ED4211A60C4",
    contractDeployer: "0x25F2Ea750BF8bE10e1139C3a19F7B4e46557D04B",
    contractMetadataRegistry: "0x520B80B85a3B9abfF75F77068116D759a11a455D",
    sigMint: constants.AddressZero,
  },
  [ChainId.Polygon]: {
    biconomyForwarder: "0x86C80a8aa58e0A4fa09A69624c31Ab2a6CAD56b8",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
    twBYOCRegistry: "0x308473Be900F4185A56587dE54bDFF5E8f7a6AE7",
    contractDeployer: "0x06312720bB2aa22346510c28bf8b4F5df20c71eb",
    contractMetadataRegistry: "0xB67D404478d91F1C94bc607b8945cBe159B86Df8",
    sigMint: constants.AddressZero,
  },
  [ChainId.Mumbai]: {
    biconomyForwarder: "0x9399BB24DBB5C4b782C70c2969F58716Ebbd6a3b",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
    twBYOCRegistry: "0x3F17972CB27506eb4a6a3D59659e0B57a43fd16C",
    contractDeployer: "0x14905281051Cc0Cf1064Ad16c319DBe324C62196",
    contractMetadataRegistry: "0x25F2Ea750BF8bE10e1139C3a19F7B4e46557D04B",
    sigMint: constants.AddressZero,
  },
  [ChainId.Avalanche]: {
    biconomyForwarder: "0x64CD353384109423a966dCd3Aa30D884C9b2E057",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
    twBYOCRegistry: constants.AddressZero,
    contractDeployer: constants.AddressZero,
    contractMetadataRegistry: constants.AddressZero,
    sigMint: constants.AddressZero,
  },
  [ChainId.AvalancheFujiTestnet]: {
    biconomyForwarder: "0x6271Ca63D30507f2Dcbf99B52787032506D75BBF",
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
    twBYOCRegistry: "0x3E6eE864f850F5e5A98bc950B68E181Cf4010F23",
    contractDeployer: "0xBD9fdebD651733e7EEAB8A83536D57023c3d3225",
    contractMetadataRegistry: "0x1e474395f58418e9c594a79abb0152D04C229E8e",
    sigMint: constants.AddressZero,
  },
  [ChainId.Fantom]: {
    biconomyForwarder: constants.AddressZero,
    twFactory: "0x97EA0Fcc552D5A8Fb5e9101316AAd0D62Ea0876B",
    twRegistry: TWRegistry_address,
    twBYOCRegistry: constants.AddressZero,
    contractDeployer: constants.AddressZero,
    contractMetadataRegistry: constants.AddressZero,
    sigMint: constants.AddressZero,
  },
  [ChainId.FantomTestnet]: {
    biconomyForwarder: constants.AddressZero,
    twFactory: TWFactory_address,
    twRegistry: TWRegistry_address,
    twBYOCRegistry: "0x3E6eE864f850F5e5A98bc950B68E181Cf4010F23",
    contractDeployer: "0xBD9fdebD651733e7EEAB8A83536D57023c3d3225",
    contractMetadataRegistry: "0x1e474395f58418e9c594a79abb0152D04C229E8e",
    sigMint: constants.AddressZero,
  },
  [ChainId.Arbitrum]: {
    biconomyForwarder: constants.AddressZero,
    twFactory: "", // TODO
    twRegistry: "", // TODO
    twBYOCRegistry: constants.AddressZero,
    contractDeployer: constants.AddressZero,
    contractMetadataRegistry: constants.AddressZero,
    sigMint: constants.AddressZero,
  },
  [ChainId.ArbitrumTestnet]: {
    biconomyForwarder: constants.AddressZero,
    twFactory: "", // TODO
    twRegistry: "", // TODO
    twBYOCRegistry: constants.AddressZero,
    contractDeployer: constants.AddressZero,
    contractMetadataRegistry: constants.AddressZero,
    sigMint: constants.AddressZero,
  },
  [ChainId.Optimism]: {
    biconomyForwarder: constants.AddressZero,
    twFactory: "", // TODO
    twRegistry: "", // TODO
    twBYOCRegistry: constants.AddressZero,
    contractDeployer: constants.AddressZero,
    contractMetadataRegistry: constants.AddressZero,
    sigMint: constants.AddressZero,
  },
  [ChainId.OptimismTestnet]: {
    biconomyForwarder: constants.AddressZero,
    twFactory: "0x3805FF4740F47c5F3206223af6e7D5d99e58a2E7", // TODO from shared deployer wallet
    twRegistry: "0xc7B5A95ee69c3384F97edcDEb31F29ed0078bF52", // TODO from shared deployer wallet
    twBYOCRegistry: constants.AddressZero,
    contractDeployer: constants.AddressZero,
    contractMetadataRegistry: constants.AddressZero,
    sigMint: constants.AddressZero,
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
    } else if (contractName === "contractMetadataRegistry") {
      return process.env.contractMetadataRegistryAddress as string;
    } else if (contractName === "sigMint") {
      return process.env.sigMintDeployerAddress as string;
    } else {
      return constants.AddressZero;
    }
  }
  // real output here
  return CONTRACT_ADDRESSES[chainId][contractName];
}

/**
 * @internal
 */
export function getContractPublisherAddress() {
  if (process.env.contractPublisherAddress) {
    return process.env.contractPublisherAddress as string;
  } else {
    return ContractPublisher_address;
  }
}
