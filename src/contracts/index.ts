import { DropErc721Contract } from "./drop-erc-721";
import { TokenErc721Contract } from "./token-erc-721";
import { DropErc1155Contract } from "./drop-erc-1155";
import { TokenErc1155Contract } from "./token-erc-1155";
import { TokenErc20Contract } from "./token-erc20";
import { VoteContract } from "./vote";
import { SplitsContract } from "./splits";
import { MarketplaceContract } from "./marketplace";
import { PacksContract } from "./packs";

/**
 * @internal
 */
export const CONTRACTS_MAP = {
  [DropErc721Contract.contractType]: DropErc721Contract,
  [TokenErc721Contract.contractType]: TokenErc721Contract,
  [DropErc1155Contract.contractType]: DropErc1155Contract,
  [TokenErc1155Contract.contractType]: TokenErc1155Contract,
  [TokenErc20Contract.contractType]: TokenErc20Contract,
  [VoteContract.contractType]: VoteContract,
  [SplitsContract.contractType]: SplitsContract,
  [MarketplaceContract.contractType]: MarketplaceContract,
  [PacksContract.contractType]: PacksContract,
} as const;

export {
  DropErc721Contract,
  TokenErc721Contract,
  DropErc1155Contract,
  TokenErc1155Contract,
  TokenErc20Contract,
  VoteContract,
  SplitsContract,
  MarketplaceContract,
  PacksContract,
};
