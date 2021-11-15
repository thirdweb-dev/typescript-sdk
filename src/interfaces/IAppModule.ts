import { CollectionModule } from "../modules/collection";
import { DatastoreModule } from "../modules/datastore";
import { DropModule } from "../modules/drop";
import { MarketModule } from "../modules/market";
import { NFTModule } from "../modules/nft";
import { PackModule } from "../modules/pack";
import { SplitsModule } from "../modules/royalty";
import { CurrencyModule } from "../modules/token";
import CollectionModuleMetadata from "../types/module-deployments/CollectionModuleMetadata";
import CurrencyModuleMetadata from "../types/module-deployments/CurrencyModuleMetadata";
import DatastoreModuleMetadata from "../types/module-deployments/DatastoreModuleMetadata";
import DropModuleMetadata from "../types/module-deployments/DropModuleMetadata";
import MarketModuleMetadata from "../types/module-deployments/MarketModuleMetadata";
import NftModuleMetadata from "../types/module-deployments/NftModuleMetadata";
import PackModuleMetadata from "../types/module-deployments/PackModuleMetadata";
import SplitsModuleMetadata from "../types/module-deployments/SplitsModuleMetadata";

export default interface IAppModule {
  deployCollectionModule(
    metadata: CollectionModuleMetadata,
  ): Promise<CollectionModule>;

  deploySplitsModule(metadata: SplitsModuleMetadata): Promise<SplitsModule>;

  deployNftModule(metadata: NftModuleMetadata): Promise<NFTModule>;

  deployCurrencyModule(
    metadata: CurrencyModuleMetadata,
  ): Promise<CurrencyModule>;

  deployMarketplaceModule(
    metadata: MarketModuleMetadata,
  ): Promise<MarketModule>;

  deployPackModule(metadata: PackModuleMetadata): Promise<PackModule>;

  deployDropModule(metadata: DropModuleMetadata): Promise<DropModule>;

  deployDatastoreModule(
    metadata: DatastoreModuleMetadata,
  ): Promise<DatastoreModule>;
}
