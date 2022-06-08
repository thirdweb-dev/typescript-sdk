import {
  Drop,
  IERC1155,
  IERC1155Metadata,
  IERC1155Supply,
  IERC20,
  IERC20Metadata,
  IERC721,
  IERC721Metadata,
  LazyMintERC721,
} from "contracts";

export type BaseERC20 = IERC20 & IERC20Metadata;
export type BaseERC721 = IERC721 & IERC721Metadata;
export type BaseERC1155 = IERC1155 & IERC1155Metadata & IERC1155Supply;
// TODO: Update with new drop contract dependency structure
export type BaseDropERC721 = BaseERC721 & Drop & LazyMintERC721;
