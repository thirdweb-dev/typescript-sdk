import Erc1155EnumerableAbi from "../../abis/IERC1155Enumerable.json";
import Erc1155Abi from "../../abis/IERC1155.json";
import MulticallAbi from "../../abis/IMulticall.json";
import IMintableERC1155Abi from "../../abis/IMintableERC1155.json";
import ISignatureMintERC1155Abi from "../../abis/ISignatureMintERC1155.json";
import ILazyMintAbi from "../../abis/ILazyMint.json";

export const FEATURE_EDITION_DROPABLE = {
  name: "ERC1155Dropable",
  namespace: "edition.drop",
  docLinks: {
    sdk: "sdk.erc1155dropable",
    contracts: "LazyMint",
  },
  abis: [Erc1155Abi, ILazyMintAbi],
  features: {},
} as const;

export const FEATURE_EDITION_SIGNATURE_MINTABLE = {
  name: "ERC1155SignatureMintable",
  namespace: "edition.signature",
  docLinks: {
    sdk: "sdk.erc1155signaturemintable",
    contracts: "ISignatureMintERC1155",
  },
  abis: [Erc1155Abi, ISignatureMintERC1155Abi],
  features: {},
} as const;

export const FEATURE_EDITION_BATCH_MINTABLE = {
  name: "ERC1155BatchMintable",
  namespace: "edition.mint.batch",
  docLinks: {
    sdk: "sdk.erc1155batchmintable",
    contracts: "IMulticall",
  },
  abis: [Erc1155Abi, IMintableERC1155Abi, MulticallAbi],
  features: {},
} as const;

export const FEATURE_EDITION_MINTABLE = {
  name: "ERC1155Mintable",
  namespace: "edition.mint",
  docLinks: {
    sdk: "sdk.erc1155mintable",
    contracts: "IMintableERC1155",
  },
  abis: [Erc1155Abi, IMintableERC1155Abi],
  features: {
    [FEATURE_EDITION_BATCH_MINTABLE.name]: FEATURE_EDITION_BATCH_MINTABLE,
  },
} as const;

export const FEATURE_EDITION_ENUMERABLE = {
  name: "ERC1155Enumerable",
  namespace: "edition.query",
  docLinks: {
    sdk: "sdk.erc1155",
    contracts: "IERC1155",
  },
  abis: [Erc1155Abi, Erc1155EnumerableAbi],
  features: {},
} as const;

export const FEATURE_EDITION = {
  name: "ERC1155",
  namespace: "edition",
  docLinks: {
    sdk: "sdk.erc1155enumerable",
    contracts: "IERC1155Enumerable",
  },
  abis: [Erc1155Abi],
  features: {
    [FEATURE_EDITION_ENUMERABLE.name]: FEATURE_EDITION_ENUMERABLE,
    [FEATURE_EDITION_MINTABLE.name]: FEATURE_EDITION_MINTABLE,
    [FEATURE_EDITION_DROPABLE.name]: FEATURE_EDITION_DROPABLE,
    [FEATURE_EDITION_SIGNATURE_MINTABLE.name]:
      FEATURE_EDITION_SIGNATURE_MINTABLE,
  },
} as const;
