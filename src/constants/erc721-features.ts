import Erc721Abi from "../../abis/ERC721.json";
import Erc721EnumerableAbi from "../../abis/ERC721Enumerable.json";
import Erc721SupplyAbi from "../../abis/ERC721Supply.json";
import IMintableERC721Abi from "../../abis/IMintableERC721.json";
import MulticallAbi from "../../abis/Multicall.json";

export const FEATURE_NFT_BATCH_MINTABLE = {
  name: "ERC721BatchMintable",
  namespace: "nft.mint.batch",
  docLinks: {
    sdk: "sdk.erc721batchmintable",
    contracts: "Multicall",
  },
  abi: MulticallAbi,
  features: {},
} as const;

export const FEATURE_NFT_MINTABLE = {
  name: "ERC721Mintable",
  namespace: "nft.mint",
  docLinks: {
    sdk: "sdk.erc721mintable",
    contracts: "IMintableERC721",
  },
  abi: IMintableERC721Abi,
  features: {
    [FEATURE_NFT_BATCH_MINTABLE.name]: FEATURE_NFT_BATCH_MINTABLE,
  },
} as const;

export const FEATURE_NFT_ENUMERABLE = {
  name: "ERC721Enumerable",
  namespace: "nft.query.owned",
  docLinks: {
    sdk: "sdk.erc721enumerable",
    contracts: "ERC721Enumerable",
  },
  abi: Erc721EnumerableAbi,
  features: {},
} as const;

export const FEATURE_NFT_SUPPLY = {
  name: "ERC721Supply",
  namespace: "nft.query",
  docLinks: {
    sdk: "sdk.erc721supply",
    contracts: "ERC721Supply",
  },
  abi: Erc721SupplyAbi,
  features: {
    [FEATURE_NFT_ENUMERABLE.name]: FEATURE_NFT_ENUMERABLE,
  },
} as const;

export const FEATURE_NFT = {
  name: "ERC721",
  namespace: "nft",
  docLinks: {
    sdk: "sdk.erc721",
    contracts: "ERC721",
  },
  abi: Erc721Abi,
  features: {
    [FEATURE_NFT_SUPPLY.name]: FEATURE_NFT_SUPPLY,
    [FEATURE_NFT_MINTABLE.name]: FEATURE_NFT_MINTABLE,
  },
} as const;
