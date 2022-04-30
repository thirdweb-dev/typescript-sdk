import {
  ERC721__factory,
  ERC721Enumerable__factory,
  ERC721Supply__factory,
  IMintableERC721__factory,
  Multicall__factory,
} from "contracts";

const FEATURE_NFT_BATCH_MINTABLE = {
  name: "ERC721BatchMintable",
  docLinks: {
    sdk: "sdk.erc721batchmintable",
    contracts: "Multicall",
  },
  abi: Multicall__factory.abi,
  features: {},
} as const;

const FEATURE_NFT_MINTABLE = {
  name: "ERC721Mintable",
  docLinks: {
    sdk: "sdk.erc721mintable",
    contracts: "IMintableERC721",
  },
  abi: IMintableERC721__factory.abi,
  features: {
    [FEATURE_NFT_BATCH_MINTABLE.name]: FEATURE_NFT_BATCH_MINTABLE,
  },
} as const;

const FEATURE_NFT_ENUMERABLE = {
  name: "ERC721Enumerable",
  docLinks: {
    sdk: "sdk.erc721ownable",
    contracts: "ERC721Enumerable",
  },
  abi: ERC721Enumerable__factory.abi,
  features: {},
} as const;

const FEATURE_NFT_SUPPLY = {
  name: "ERC721Supply",
  docLinks: {
    sdk: "sdk.erc721enumerable",
    contracts: "ERC721Enumerable",
  },
  abi: ERC721Supply__factory.abi,
  features: {
    [FEATURE_NFT_ENUMERABLE.name]: FEATURE_NFT_ENUMERABLE,
  },
} as const;

const FEATURE_NFT = {
  name: "ERC721",
  docLinks: {
    sdk: "sdk.erc721",
    contracts: "ERC721",
  },
  abi: ERC721__factory.abi,
  features: {
    [FEATURE_NFT_SUPPLY.name]: FEATURE_NFT_SUPPLY,
    [FEATURE_NFT_MINTABLE.name]: FEATURE_NFT_MINTABLE,
  },
} as const;

export type Feature =
  | typeof FEATURE_NFT
  | typeof FEATURE_NFT_SUPPLY
  | typeof FEATURE_NFT_ENUMERABLE
  | typeof FEATURE_NFT_MINTABLE
  | typeof FEATURE_NFT_BATCH_MINTABLE;

export type FeatureName = Feature["name"];
export type FeatureWithEnabled = Feature & {
  features: Record<string, FeatureWithEnabled>;
  enabled: boolean;
};

export const SUPPORTED_FEATURES: Record<string, Feature> = {
  [FEATURE_NFT.name]: FEATURE_NFT,
};
