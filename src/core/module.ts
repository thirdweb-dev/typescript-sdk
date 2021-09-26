import { Provider } from "@ethersproject/providers";
import { Signer } from "ethers";
import invariant from "ts-invariant";
import type { ProviderOrSigner } from "./types";

/**
 *
 * The root Module class to be extended and not used directly!
 * @internal
 *
 */
export class Module {
  public readonly address: string;
  protected readonly ipfsGatewayUrl: string;
  private _providerOrSigner: ProviderOrSigner | null = null;
  protected get providerOrSigner(): ProviderOrSigner {
    return this.signer || this._providerOrSigner || this.getProviderOrSigner();
  }
  private set providerOrSigner(value: ProviderOrSigner) {
    this._providerOrSigner = value;
  }
  private _signer: Signer | null = null;
  protected get signer(): Signer | null {
    return this._signer;
  }
  private set signer(value: Signer | null) {
    this._signer = value;
  }

  constructor(
    providerOrSigner: ProviderOrSigner,
    address: string,
    ipfsGatewayUrl: string,
  ) {
    this.address = address;
    this.ipfsGatewayUrl = ipfsGatewayUrl;
    this.setProviderOrSigner(providerOrSigner);
  }

  setProviderOrSigner(providerOrSigner: ProviderOrSigner) {
    this.providerOrSigner = providerOrSigner;
    if (Signer.isSigner(providerOrSigner)) {
      this.signer = providerOrSigner;
    }
    this.connectContract();
  }

  clearSigner(): void {
    this.signer = null;
  }

  private getProviderOrSigner(): ProviderOrSigner {
    return this.signer || this.providerOrSigner;
  }

  protected getSigner(): Signer | null {
    if (Signer.isSigner(this.signer)) {
      return this.signer;
    }
    return null;
  }

  protected hasValidSigner(): boolean {
    return Signer.isSigner(this.signer);
  }

  protected async getSignerAddress(): Promise<string> {
    const signer = this.getSigner();
    invariant(signer, "Cannot get signer address without valid signer");
    return await signer.getAddress();
  }

  protected async getChainID(): Promise<number> {
    const provider = Provider.isProvider(this.providerOrSigner)
      ? this.providerOrSigner
      : this.providerOrSigner.provider;
    invariant(provider, "getRegistryAddress() -- No Provider");
    const { chainId } = await provider.getNetwork();
    return chainId;
  }

  protected connectContract() {
    throw new Error("connectContract has to be implemented");
  }
}
