import { ModuleType } from "../common/module-type";
import {
  BundleCollectionMetadata,
  BundleDropModuleMetadata,
  MarketplaceModuleMetadata,
  NFTCollectionModuleMetadata,
  NFTDropModuleMetadata,
  PackModuleMetadata,
  SplitsModuleMetadata,
  TokenModuleMetadata,
  VoteModuleMetadata,
} from "../schema";

export type ContractMetadataSchema =
  | BundleCollectionMetadata
  | BundleDropModuleMetadata
  | MarketplaceModuleMetadata
  | NFTCollectionModuleMetadata
  | NFTDropModuleMetadata
  | PackModuleMetadata
  | SplitsModuleMetadata
  | TokenModuleMetadata
  | VoteModuleMetadata;

/**
 * The module metadata, includes the `address` and the {@link ModuleType}.
 * @public
 */
export interface ModuleMetadata<
  TContractMetadata extends ContractMetadataSchema,
> {
  address: string;
  metadata?: TContractMetadata;
  type: ModuleType;
}
