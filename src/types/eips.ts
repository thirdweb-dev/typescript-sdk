import {
  ERC1155,
  ERC1155Metadata,
  ERC1155Supply,
  ERC20,
  ERC20Metadata,
  ERC721,
  ERC721Metadata,
} from "contracts";

export type BaseERC20 = ERC20 & ERC20Metadata;
export type BaseERC721 = ERC721 & ERC721Metadata;
export type BaseERC1155 = ERC1155 & ERC1155Metadata & ERC1155Supply;
