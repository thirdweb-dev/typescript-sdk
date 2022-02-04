import { DropErc721Module } from "./drop-erc-721";
import { TokenErc721Module } from "./token-erc-721";
import { DropErc1155Module } from "./drop-erc-1155";
import { TokenErc1155Module } from "./token-erc-1155";
import { TokenErc20Module } from "./token-erc20";
import { VoteModule } from "./vote";

/**
 * @internal
 */
export const MODULES_MAP = {
  [DropErc721Module.moduleType]: DropErc721Module,
  [TokenErc721Module.moduleType]: TokenErc721Module,
  [DropErc1155Module.moduleType]: DropErc1155Module,
  [TokenErc1155Module.moduleType]: TokenErc1155Module,
  [TokenErc20Module.moduleType]: TokenErc20Module,
  [VoteModule.moduleType]: VoteModule,
} as const;

export {
  DropErc721Module,
  TokenErc721Module,
  DropErc1155Module,
  TokenErc1155Module,
  TokenErc20Module,
  VoteModule,
};
