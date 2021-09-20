import { Signer } from "@ethersproject/abstract-signer";
import invariant from "ts-invariant";
import type { ProviderOrSigner, SDKOptions } from "./";

export class SubSDK {
  protected opts: SDKOptions;
  public providerOrSigner: ProviderOrSigner;
  public readonly address: string;

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    opts: SDKOptions,
  ) {
    this.providerOrSigner = providerOrSigner;
    this.address = address;
    this.opts = opts;
  }

  public async getSignerAddress() {
    const potentialSigner = this.providerOrSigner;
    invariant(Signer.isSigner(potentialSigner), "Not a valid signer");

    return await potentialSigner.getAddress();
  }
}
