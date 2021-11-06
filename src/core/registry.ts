import { Registry, Registry__factory } from "@3rdweb/contracts";
import { ContractMetadata, getContractMetadata } from "../common/contract";
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
export class RegistryModule extends Module<Registry> {
  /**
   * @internal
   */
  protected connectContract(): Registry {
    return Registry__factory.connect(this.address, this.providerOrSigner);
  }

  /**
   * @internal
   */
  public async getProtocolContracts(): Promise<IAppModule[]> {
    const deployer = await this.getSignerAddress();
    const maxVersion = await this.readOnlyContract.getProtocolControlCount(
      deployer,
    );
    const versions = Array.from(Array(maxVersion.toNumber()).keys()).reverse();
    const addresses = await Promise.all(
      versions.map((v) =>
        this.readOnlyContract.getProtocolControl(deployer, (v + 1).toString()),
      ),
    );
    const metadatas = await Promise.all(
      addresses.map((address) =>
        getContractMetadata(
          this.providerOrSigner,
          address,
          this.ipfsGatewayUrl,
        ).catch(() => undefined),
      ),
    );
    return versions.map((v, i) => {
      return {
        address: addresses[i],
        version: v,
        metadata: metadatas[i],
      };
    });
  }
}
