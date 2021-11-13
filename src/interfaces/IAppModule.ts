import { CollectionModule } from "../modules/collection";
import { SplitsModule } from "../modules/royalty";
import CollectionModuleMetadata from "../types/module-deployments/CollectionModuleMetadata";
import SplitsModuleMetadata from "../types/module-deployments/SplitsModuleMetadata";

export default interface IAppModule {
  deployCollectionModule(
    metadata: CollectionModuleMetadata,
  ): Promise<CollectionModule>;

  deploySplitsModule(metadata: SplitsModuleMetadata): Promise<SplitsModule>;
}
