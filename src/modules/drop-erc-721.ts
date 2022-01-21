import { BaseModule } from "../core/classes/module";

export class DropErc721Module extends BaseModule<
  typeof DropErc721Module.moduleType
> {
  static moduleType = "NftDrop" as const;
}
