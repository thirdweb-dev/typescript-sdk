import Erc1155EnumerableAbi from "../../abis/ERC1155Enumerable.json";
import Erc1155Abi from "../../abis/ERC1155.json";

export const FEATURE_EDITION_ENUMERABLE = {
  name: "ERC155Enumerable",
  namespace: "edition.query",
  docLinks: {
    sdk: "sdk.erc1155",
    contracts: "ERC1155",
  },
  abi: Erc1155EnumerableAbi,
  features: {},
} as const;

export const FEATURE_EDITION = {
  name: "ERC155",
  namespace: "edition",
  docLinks: {
    sdk: "sdk.erc1155",
    contracts: "ERC1155",
  },
  abi: Erc1155Abi,
  features: {
    [FEATURE_EDITION_ENUMERABLE.name]: FEATURE_EDITION_ENUMERABLE,
  },
} as const;
