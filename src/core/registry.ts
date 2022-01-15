import { ThirdwebRegistry, ThirdwebRegistry__factory } from "@3rdweb/contracts";
import { ContractMetadata, getContractMetadata } from "../common/contract";
import { ModuleType } from "../common/module-type";
import { Module } from "./module";

/**
 * @public
 */
export interface IAppModule {
  address: string;
  version: number;
  metadata?: ContractMetadata;
}

/**
 * The RegistryModule. This should always be created via `getRegistryModule()` on the main SDK.
 * @internal
 */
export class RegistryModule extends Module<ThirdwebRegistry, any> {
  /**
   * @internal
   */
  protected connectContract(): ThirdwebRegistry {
    return ThirdwebRegistry__factory.connect(
      this.address,
      this.providerOrSigner,
    );
  }

  private async getAllModuleAddresses(moduleType: ModuleType, address: string) {
    return await this.readOnlyContract.getAllModulesOfType(moduleType, address);
  }

  /**
   * @internal
   * @param addresses - The addresses of the modules to get metadata for.
   */
  public async getAllContractMetadata(addresses: string[]) {
    const metadatas = await Promise.all(
      addresses.map((address) =>
        getContractMetadata(
          this.providerOrSigner,
          address,
          this.ipfsGatewayUrl,
          true,
        ),
      ),
    );
    return addresses
      .filter((d) => d)
      .map((address, i) => {
        return {
          address,
          metadata: metadatas[i],
        };
      });
  }

  /**
   * Method to get a list of all module metadata on a given app.
   * @public
   * @param filterByModuleType - Optional array of {@link ModuleType} to filter by.
   * @returns Array of module metadata
   */
  public async getModules(address: string, filterByModuleType?: ModuleType[]) {
    const moduleTypesToGet = filterByModuleType || [
      "NFT_COLLECTION",
      "BUNDLE_COLLECTION",
      "PACK",
      "TOKEN",
      "NFT_DROP",
      "BUNDLE_DROP",
      "VOTE",
      "SPLITS",
      "MARKETPLACE",
    ];
    return (
      await Promise.all(
        moduleTypesToGet.map(async (moduleType) => {
          const moduleAddresses = await this.getAllModuleAddresses(
            moduleType,
            address,
          );
          return (await this.getAllContractMetadata(moduleAddresses)).map(
            (m) => ({
              ...m,
              type: moduleType,
            }),
          );
        }),
      )
    ).reduce((acc, curr) => acc.concat(curr), []);
  }
}
