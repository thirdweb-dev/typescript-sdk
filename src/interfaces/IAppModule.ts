import { CollectionModule } from "../modules/collection";
import { DropModule } from "../modules/drop";
import { MarketModule } from "../modules/market";
import { NFTModule } from "../modules/nft";
import { PackModule } from "../modules/pack";
import { SplitsModule } from "../modules/royalty";
import { CurrencyModule } from "../modules/token";
import CollectionModuleMetadata from "../types/module-deployments/CollectionModuleMetadata";
import NftModuleMetadata from "../types/module-deployments/NftModuleMetadata";
import SplitsModuleMetadata from "../types/module-deployments/SplitsModuleMetadata";

export default interface IAppModule {
  deployCollectionModule(
    metadata: CollectionModuleMetadata,
  ): Promise<CollectionModule>;

  deploySplitsModule(metadata: SplitsModuleMetadata): Promise<SplitsModule>;

  deployNftModule(metadata: NftModuleMetadata): Promise<NFTModule>;

  deployCurrencyModule(metadata: any): Promise<CurrencyModule>;

  deployMarketplaceModule(metadata: any): Promise<MarketModule>;

  deployPackModule(metadata: any): Promise<PackModule>;

  deployDropModule(metadata: any): Promise<DropModule>;
}
