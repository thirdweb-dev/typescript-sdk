import { DropErc721ClaimConditions } from "../core/classes/drop-erc721-claim-conditions";
import { DropErc721Module } from "./drop-erc-721";
import { TokenErc721Module } from "./token-erc-721";

/**
 * @internal
 */
export const MODULES_MAP = {
  [DropErc721Module.moduleType]: DropErc721Module,
  [TokenErc721Module.moduleType]: TokenErc721Module,
} as const;

export { DropErc721Module, DropErc721ClaimConditions };
