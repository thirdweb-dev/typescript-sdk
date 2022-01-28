import { DropErc721Module } from "./drop-erc-721";

/**
 * @internal
 */
export const MODULES_MAP = {
  [DropErc721Module.moduleType]: DropErc721Module,
} as const;

export { DropErc721Module };
