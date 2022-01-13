import { ContractMetadata } from "../common/contract";
import { ModuleType } from "../common/module-type";

/**
 * The module metadata, includes the `address` and the {@link ModuleType}.
 * @public
 */
export interface ModuleMetadata {
  address: string;
  metadata?: ContractMetadata;
  type: ModuleType;
}
