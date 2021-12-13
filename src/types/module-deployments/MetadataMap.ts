import { ModuleType } from "../../common/module-type";
import CommonModuleMetadata from "./CommonModuleMetadata";
import BundleModuleMetadata from "./BundleModuleMetadata";

export type AllModuleMetadata = BundleModuleMetadata | CommonModuleMetadata;

// TODO: Create metadata mapings for all modules
export type ModuleMetadataMap = {
  [ModuleType.COLLECTION]: BundleModuleMetadata;
  [ModuleType.ACCESS_NFT]: CommonModuleMetadata;
  [ModuleType.CURRENCY]: CommonModuleMetadata;
  [ModuleType.DATASTORE]: CommonModuleMetadata;
  [ModuleType.DROP]: CommonModuleMetadata;
  [ModuleType.DYNAMIC_NFT]: CommonModuleMetadata;
  [ModuleType.MARKET]: CommonModuleMetadata;
  [ModuleType.NFT]: CommonModuleMetadata;
  [ModuleType.PACK]: CommonModuleMetadata;
  [ModuleType.SPLITS]: CommonModuleMetadata;
};
