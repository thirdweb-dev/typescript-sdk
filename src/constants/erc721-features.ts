import Erc721Abi from "../../abis/IERC721.json";
import Erc721EnumerableAbi from "../../abis/IERC721Enumerable.json";
import Erc721SupplyAbi from "../../abis/IERC721Supply.json";
import IMintableERC721Abi from "../../abis/IMintableERC721.json";
import MulticallAbi from "../../abis/IMulticall.json";
import LazyMintERC721Abi from "../../abis/LazyMintERC721.json";
import DelayedRevealAbi from "../../abis/DelayedReveal.json";

export const FEATURE_NFT_LAZY_MINTABLE = {
  name: "ERC721LazyMintable",
  namespace: "nft.lazyMint",
  docLinks: {
    sdk: "sdk.erc721lazymintable",
    contracts: "LazyMintERC721",
  },
  abis: [Erc721Abi, LazyMintERC721Abi],
  features: {},
} as const;

export const FEATURE_NFT_BATCH_MINTABLE = {
  name: "ERC721BatchMintable",
  namespace: "nft.mint.batch",
  docLinks: {
    sdk: "sdk.erc721batchmintable",
    contracts: "IMulticall",
  },
  abis: [Erc721Abi, IMintableERC721Abi, MulticallAbi],
  features: {},
} as const;

export const FEATURE_NFT_MINTABLE = {
  name: "ERC721Mintable",
  namespace: "nft.mint",
  docLinks: {
    sdk: "sdk.erc721mintable",
    contracts: "IMintableERC721",
  },
  abis: [Erc721Abi, IMintableERC721Abi],
  features: {
    [FEATURE_NFT_BATCH_MINTABLE.name]: FEATURE_NFT_BATCH_MINTABLE,
  },
} as const;

export const FEATURE_NFT_ENUMERABLE = {
  name: "ERC721Enumerable",
  namespace: "nft.query.owned",
  docLinks: {
    sdk: "sdk.erc721enumerable",
    contracts: "IERC721Enumerable",
  },
  abis: [Erc721Abi, Erc721EnumerableAbi],
  features: {},
} as const;

export const FEATURE_NFT_SUPPLY = {
  name: "ERC721Supply",
  namespace: "nft.query",
  docLinks: {
    sdk: "sdk.erc721supply",
    contracts: "IERC721Supply",
  },
  abis: [Erc721Abi, Erc721SupplyAbi],
  features: {
    [FEATURE_NFT_ENUMERABLE.name]: FEATURE_NFT_ENUMERABLE,
  },
} as const;

export const FEATURE_NFT_REVEALABLE = {
  name: "ERC721Revealable",
  namespace: "nft.revealer",
  docLinks: {
    sdk: "sdk.delayedreveal",
    contracts: "IDelayedReveal",
  },
  abis: [Erc721Abi, DelayedRevealAbi, LazyMintERC721Abi],
  features: {},
} as const;

export const FEATURE_NFT = {
  name: "ERC721",
  namespace: "nft",
  docLinks: {
    sdk: "sdk.erc721",
    contracts: "IERC721",
  },
  abis: [Erc721Abi],
  features: {
    [FEATURE_NFT_SUPPLY.name]: FEATURE_NFT_SUPPLY,
    [FEATURE_NFT_MINTABLE.name]: FEATURE_NFT_MINTABLE,
    [FEATURE_NFT_LAZY_MINTABLE.name]: FEATURE_NFT_LAZY_MINTABLE,
    [FEATURE_NFT_REVEALABLE.name]: FEATURE_NFT_REVEALABLE,
  },
} as const;
