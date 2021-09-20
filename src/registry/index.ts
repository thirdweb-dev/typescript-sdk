import { SDKOptions, ProviderOrSigner } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { Registry, Registry__factory } from "../types";
import { ContractMetadata, getContractMetadata } from "../common/contract";

export interface RegistryControl {
  address: string;
  version: number;
  metadata?: ContractMetadata;
}

export class RegistrySDK extends SubSDK {
  public readonly contract: Registry;

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    opts: SDKOptions,
  ) {
    super(providerOrSigner, address, opts);

    this.contract = Registry__factory.connect(
      this.address,
      this.providerOrSigner,
    );
  }

  public async getProtocolContracts(): Promise<RegistryControl[]> {
    const deployer = await this.getSignerAddress();
    const maxVersion = await this.contract.getLatestVersion(deployer);
    const versions = Array.from(Array(maxVersion.toNumber()).keys()).reverse();
    const addresses = await Promise.all(
      versions.map((i) =>
        this.contract.getProtocolControl(deployer, i.toString()),
      ),
    );
    const metadatas = await Promise.all(
      addresses.map((address) =>
        getContractMetadata(
          this.providerOrSigner,
          address,
          this.opts.ipfsGatewayUrl,
        ).catch(() => null),
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
