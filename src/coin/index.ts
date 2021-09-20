import type { ProviderOrSigner } from "../core";
import { SDKOptions } from "../core";
import { SubSDK } from "../core/sub-sdk";
import { Coin, Coin__factory } from "../types";

export class CoinSDK extends SubSDK {
  public contract: Coin;

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    opts: SDKOptions,
  ) {
    super(providerOrSigner, address, opts);

    this.contract = Coin__factory.connect(this.address, this.providerOrSigner);
  }
}
