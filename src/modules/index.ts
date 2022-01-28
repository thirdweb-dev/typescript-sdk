import { DropERC721Module } from "./drop-erc-721";

/**
 * @internal
 */
export const MODULES_MAP = {
  [DropERC721Module.moduleType]: DropERC721Module,
} as const;

export { DropERC721Module };
