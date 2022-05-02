import {
  ERC721__factory,
  ERC721Enumerable__factory,
  ERC721Supply__factory,
  IMintableERC721__factory,
  Multicall__factory,
} from "contracts";

const FEATURE_NFT_BATCH_MINTABLE = {
  name: "ERC721BatchMintable",
  namespace: "nft.mint.batch",
  docLinks: {
    sdk: "sdk.erc721batchmintable",
    contracts: "Multicall",
  },
  abi: Multicall__factory.abi,
  features: {},
} as const;

const FEATURE_NFT_MINTABLE = {
  name: "ERC721Mintable",
  namespace: "nft.mint",
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
  namespace: "nft.query.owned",
  docLinks: {
    sdk: "sdk.erc721enumerable",
    contracts: "ERC721Enumerable",
  },
  abi: ERC721Enumerable__factory.abi,
  features: {},
} as const;

const FEATURE_NFT_SUPPLY = {
  name: "ERC721Supply",
  namespace: "nft.query",
  docLinks: {
    sdk: "sdk.erc721supply",
    contracts: "ERC721Supply",
  },
  abi: ERC721Supply__factory.abi,
  features: {
    [FEATURE_NFT_ENUMERABLE.name]: FEATURE_NFT_ENUMERABLE,
  },
} as const;

const FEATURE_NFT = {
  name: "ERC721",
  namespace: "nft",
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

/**
 * @internal
 */
export type Feature =
  | typeof FEATURE_NFT
  | typeof FEATURE_NFT_SUPPLY
  | typeof FEATURE_NFT_ENUMERABLE
  | typeof FEATURE_NFT_MINTABLE
  | typeof FEATURE_NFT_BATCH_MINTABLE;

/**
 * @internal
 */
export type FeatureName = Feature["name"];
/**
 * @internal
 */
export type FeatureWithEnabled = Feature & {
  features: Record<string, FeatureWithEnabled>;
  enabled: boolean;
};

/**
 * @internal
 */
export const SUPPORTED_FEATURES: Record<string, Feature> = {
  [FEATURE_NFT.name]: FEATURE_NFT,
};
