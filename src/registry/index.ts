import { SDKOptions, ProviderOrSigner } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { Registry, Registry__factory } from "../types";

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
}
