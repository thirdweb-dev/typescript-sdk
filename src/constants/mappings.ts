import { DropERC721, DropERC721__factory } from "@3rdweb/contracts";

import { DropErc721Module } from "../modules/drop-erc-721";
import {
  DropErc721ModuleDeploy,
  DropErc721ModuleInput,
  DropErc721ModuleOutput,
} from "../schema/modules/drop-erc721";

export const MODULES_MAP = {
  [DropERC721__factory.contractName]: DropErc721Module,
} as const;

export type MODULE_TYPE_TO_CONTRACT_MAP = {
  [DropERC721__factory.contractName]: DropERC721;
};

export const MODULE_TYPE_TO_SCHEMA_MAP = {
  [DropERC721__factory.contractName]: {
    deploy: DropErc721ModuleInput,
    output: DropErc721ModuleOutput,
    input: DropErc721ModuleDeploy,
  } as const,
} as const;
