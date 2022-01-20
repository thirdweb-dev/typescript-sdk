import {
  DropERC721,
  DropERC721__factory,
  TokenERC721__factory,
} from "@3rdweb/contracts";

import { BaseClass } from "../core/classes/base";
import { ModuleType } from "../core/types";
import {
  DropErc20DeploySchema,
  DropErc20MetadataSchema,
} from "../schema/modules/drop-erc20";

export class Module extends BaseClass {
  static moduleType: ModuleType = "base_module";
  public moduleType: ModuleType = Module.moduleType;
}

export class DropModule extends Module {
  static override moduleType: ModuleType = DropERC721__factory.name;
  getDrops() {
    return "foo";
  }
}

export class NFTModule extends Module {
  static override moduleType: ModuleType = TokenERC721__factory.name;
  getNFTs() {
    return "bar";
  }
}
export const MODULES_MAP = {
  [DropERC721__factory.contractName]: DropModule,
} as const;

export type MODULE_TYPE_TO_CONTRACT_MAP = {
  [DropERC721__factory.contractName]: DropERC721;
};

export const MODULE_TYPE_TO_SCHEMA_MAP = {
  [DropERC721__factory.contractName]: {
    deploy: DropErc20DeploySchema,
    regular: DropErc20MetadataSchema,
  } as const,
} as const;
