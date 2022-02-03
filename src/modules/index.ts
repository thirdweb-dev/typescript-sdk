import { DropErc721Module } from "./drop-erc-721";
import { TokenErc721Module } from "./token-erc-721";
import { DropErc1155Module } from "./drop-erc-1155";

/**
 * @internal
 */
export const MODULES_MAP = {
  [DropErc721Module.moduleType]: DropErc721Module,
  [TokenErc721Module.moduleType]: TokenErc721Module,
  [DropErc1155Module.moduleType]: DropErc1155Module,
} as const;

export { DropErc721Module, TokenErc721Module, DropErc1155Module };
