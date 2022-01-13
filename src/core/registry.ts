import { ThirdwebRegistry, ThirdwebRegistry__factory } from "@3rdweb/contracts";
import { ContractMetadata, getContractMetadata } from "../common/contract";
import { ModuleType } from "../common/module-type";
import { ModuleMetadata, ModuleMetadataNoType } from "../types/ModuleMetadata";
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
export class RegistryModule extends Module<ThirdwebRegistry> {
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
  public async getAllContractMetadata(
    addresses: string[],
  ): Promise<ModuleMetadataNoType[]> {
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
  public async getModules(
    address: string,
    filterByModuleType?: ModuleType[],
  ): Promise<ModuleMetadata[]> {
    const moduleTypesToGet = filterByModuleType || [
      ModuleType.NFT,
      ModuleType.BUNDLE,
      ModuleType.PACK,
      ModuleType.TOKEN,
      ModuleType.DROP,
      ModuleType.BUNDLE_DROP,
      ModuleType.VOTE,
      ModuleType.SPLITS,
      ModuleType.MARKETPLACE,
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
