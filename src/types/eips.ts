import {
  DelayedReveal,
  Drop,
  IClaimConditionsMultiPhase,
  IERC1155,
  IERC1155Metadata,
  IERC1155Supply,
  IERC20,
  IERC20Metadata,
  IERC721,
  IERC721Metadata,
  SignatureMintERC721,
} from "contracts";

export type BaseERC20 = IERC20 & IERC20Metadata;
export type BaseERC721 = IERC721 & IERC721Metadata;
export type BaseERC1155 = IERC1155 & IERC1155Metadata & IERC1155Supply;
export type BaseDropERC721 = BaseERC721 & Drop;
export type BaseDelayedRevealERC721 = BaseDropERC721 & DelayedReveal;
export type BaseClaimConditionERC721 = BaseDropERC721 &
  IClaimConditionsMultiPhase;
export type BaseSignatureMintERC721 = BaseERC721 & SignatureMintERC721;
