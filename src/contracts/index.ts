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

export {
  NFTDrop,
  NFTCollection,
  NFTStackDrop,
  NFTStackCollection,
  Token,
  Vote,
  Split,
  Marketplace,
  Pack,
};
