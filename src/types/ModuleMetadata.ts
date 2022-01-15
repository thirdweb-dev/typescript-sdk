import { ContractMetadata } from "../common/contract";
import { ModuleType } from "../common/module-type";

/**
 * The module metadata, includes the `address` and the {@link ModuleType}.
 * @public
 */
export interface ModuleMetadata<TContractMetadata extends ContractMetadata> {
  address: string;
  metadata?: TContractMetadata;
  type: ModuleType;
}
