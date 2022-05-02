import Erc1155EnumerableAbi from "../../abis/ERC1155Enumerable.json";
import Erc1155Abi from "../../abis/ERC1155.json";

export const FEATURE_EDITION_ENUMERABLE = {
  name: "ERC1155Enumerable",
  namespace: "edition.query",
  docLinks: {
    sdk: "sdk.erc1155",
    contracts: "ERC1155",
  },
  abi: Erc1155EnumerableAbi,
  features: {},
} as const;

export const FEATURE_EDITION = {
  name: "ERC1155",
  namespace: "edition",
  docLinks: {
    sdk: "sdk.erc1155enumerable",
    contracts: "ERC1155Enumerable",
  },
  abi: Erc1155Abi,
  features: {
    [FEATURE_EDITION_ENUMERABLE.name]: FEATURE_EDITION_ENUMERABLE,
  },
} as const;
