import { z } from "zod";
import { AbiSchema } from "../schema/contracts/custom";
import {
  ERC721__factory,
  ERC721Enumerable__factory,
  ERC721Supply__factory,
  IMintableERC721__factory,
  Multicall__factory,
} from "contracts";

export type Feature = {
  name: string;
  docLinks: {
    sdk: string;
    contracts: string;
  };
  abi: z.input<typeof AbiSchema>;
  features: Record<string, Feature>;
  enabled: boolean;
};

export type FeatureName =
  | "ERC721"
  | "ERC721Supply"
  | "ERC721Enumerable"
  | "ERC721Mintable"
  | "ERC721BatchMintable";

const FEATURE_NFT_BATCH_MINTABLE: Feature = {
  name: "ERC721BatchMintable" as const,
  docLinks: {
    sdk: "",
    contracts: "Multicall",
  },
  abi: Multicall__factory.abi,
  enabled: false,
  features: {},
};

const FEATURE_NFT_MINTABLE: Feature = {
  name: "ERC721Mintable",
  docLinks: {
    sdk: "sdk.erc721mintable",
    contracts: "IMintableERC721",
  },
  abi: IMintableERC721__factory.abi,
  enabled: false,
  features: {
    [FEATURE_NFT_BATCH_MINTABLE.name]: FEATURE_NFT_BATCH_MINTABLE,
  },
};

const FEATURE_NFT_ENUMERABLE: Feature = {
  name: "ERC721Enumerable",
  docLinks: {
    sdk: "sdk.erc721ownable",
    contracts: "ERC721Enumerable",
  },
  abi: ERC721Enumerable__factory.abi,
  enabled: false,
  features: {},
};

const FEATURE_NFT_SUPPLY: Feature = {
  name: "ERC721Supply",
  docLinks: {
    sdk: "sdk.erc721enumerable",
    contracts: "ERC721Enumerable",
  },
  abi: ERC721Supply__factory.abi,
  enabled: false,
  features: {
    [FEATURE_NFT_ENUMERABLE.name]: FEATURE_NFT_ENUMERABLE,
  },
};

const FEATURE_NFT: Feature = {
  name: "ERC721",
  docLinks: {
    sdk: "sdk.erc721",
    contracts: "ERC721",
  },
  abi: ERC721__factory.abi,
  enabled: false,
  features: {
    [FEATURE_NFT_SUPPLY.name]: FEATURE_NFT_SUPPLY,
    [FEATURE_NFT_MINTABLE.name]: FEATURE_NFT_MINTABLE,
  },
};

export const SUPPORTED_FEATURES: Record<string, Feature> = {
  [FEATURE_NFT.name]: FEATURE_NFT,
};
