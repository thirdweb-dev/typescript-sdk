import { ContractMetadata, getContractMetadata } from "../common/contract";
import { Module } from "../core/module";
import { Registry, Registry__factory } from "../types";

export interface RegistryControl {
  address: string;
  version: number;
  metadata?: ContractMetadata;
}

export class RegistrySDK extends Module {
  private _contract: Registry | null = null;
  public get contract(): Registry {
    return this._contract || this.connectContract();
  }
  private set contract(value: Registry) {
    this._contract = value;
  }

  protected connectContract(): Registry {
    return (this.contract = Registry__factory.connect(
      this.address,
      this.providerOrSigner,
    ));
  }

  public async getProtocolContracts(): Promise<RegistryControl[]> {
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
