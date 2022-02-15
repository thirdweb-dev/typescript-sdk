import { NFTCollection } from "./nft-collection";
import { NFTStackDrop } from "./nft-stack-drop";
import { NFTStackCollection } from "./nft-stack-collection";
import { Token } from "./token";
import { Vote } from "./vote";
import { Split } from "./split";
import { Marketplace } from "./marketplace";
import { Pack } from "./pack";
import { NFTDrop } from "./nft-drop";

/**
 * @internal
 */
export const CONTRACTS_MAP = {
  [NFTDrop.contractType]: NFTDrop,
  [NFTCollection.contractType]: NFTCollection,
  [NFTStackDrop.contractType]: NFTStackDrop,
  [NFTStackCollection.contractType]: NFTStackCollection,
  [Token.contractType]: Token,
  [Vote.contractType]: Vote,
  [Split.contractType]: Split,
  [Marketplace.contractType]: Marketplace,
  [Pack.contractType]: Pack,
} as const;

/**
 * @internal
 */
export const REMOTE_CONTRACT_TYPE = {
  [NFTDrop.contractType]: "DropERC721",
  [NFTCollection.contractType]: "TokenERC721",
  [NFTStackDrop.contractType]: "DropERC1155",
  [NFTStackCollection.contractType]: "TokenERC1155",
  [Token.contractType]: "TokenERC20",
  [Vote.contractType]: "VoteERC20",
  [Split.contractType]: "Split",
  [Marketplace.contractType]: "Marketplace",
  [Pack.contractType]: "Pack",
} as const;

/**
 * @internal
 */
export const REMOTE_CONTRACT_TO_CONTRACT_TYPE = {
  DropERC721: NFTDrop.contractType,
  TokenERC721: NFTCollection.contractType,
  DropERC1155: NFTStackDrop.contractType,
  TokenERC1155: NFTStackCollection.contractType,
  TokenERC20: Token.contractType,
  VoteERC20: Vote.contractType,
  Split: Split.contractType,
  Marketplace: Marketplace.contractType,
  Pack: Pack.contractType,
} as const;
