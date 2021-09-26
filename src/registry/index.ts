import { Registry, Registry__factory } from "../../contract-interfaces";
import { ContractMetadata, getContractMetadata } from "../common/contract";
import { Module } from "../core/module";

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
export class RegistryModule extends Module {
  private __contract: Registry | null = null;
  /**
   * @internal - This is a temporary way to access the underlying contract directly and will likely become private once this module implements all the contract functions.
   */
  public get contract(): Registry {
    return this.__contract || this.connectContract();
  }
  private set contract(value: Registry) {
    this.__contract = value;
  }

  /**
   * @internal
   */
  protected connectContract(): Registry {
    return (this.contract = Registry__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  public async getProtocolContracts(): Promise<IAppModule[]> {
    const deployer = await this.getSignerAddress();
    const maxVersion = await this.contract.getLatestVersion(deployer);
    const versions = Array.from(Array(maxVersion.toNumber()).keys()).reverse();
    const addresses = await Promise.all(
      versions.map((v) =>
        this.contract.getProtocolControl(deployer, v.toString()),
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
