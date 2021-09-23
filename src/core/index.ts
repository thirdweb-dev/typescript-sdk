import { Signer } from "@ethersproject/abstract-signer";
import { AddressZero } from "@ethersproject/constants";
import { Network, Provider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { C } from "ts-toolbelt";
import { CurrencySDK } from "../currency";
import { ControlSDK } from "../control";
import { MarketSDK } from "../market";
import { NFTSDK } from "../nft";
import { CollectionSDK } from "../collection";
import { PackSDK } from "../pack";
import { RegistrySDK } from "../registry";

export type ProviderOrSigner = Provider | Signer;

export type ValidProviderInput = ProviderOrSigner | Network | string;

export interface SDKOptions {
  ipfsGatewayUrl: string;
}

type AnyContract =
  | typeof ControlSDK
  | typeof CollectionSDK
  | typeof NFTSDK
  | typeof CurrencySDK
  | typeof MarketSDK
  | typeof PackSDK
  | typeof RegistrySDK;

export class NFTLabsSDK {
  private ipfsGatewayUrl: string = "https://cloudflare-ipfs.com/ipfs/";
  private modules = new Map<string, C.Instance<AnyContract>>();
  private providerOrSigner: ProviderOrSigner;
  private signer: Signer | null = null;

  constructor(
    providerOrNetwork: ValidProviderInput,
    opts?: Partial<SDKOptions>,
  ) {
    this.providerOrSigner = this.setProviderOrSigner(providerOrNetwork);
    if (opts?.ipfsGatewayUrl) {
      this.ipfsGatewayUrl = opts.ipfsGatewayUrl;
    }
  }

  public setProviderOrSigner(providerOrNetwork: ValidProviderInput) {
    if (
      Provider.isProvider(providerOrNetwork) ||
      Signer.isSigner(providerOrNetwork)
    ) {
      // sdk instantiated with a provider / signer
      this.providerOrSigner = providerOrNetwork;
    } else {
      // sdk instantiated with a network name / network url
      this.providerOrSigner = ethers.getDefaultProvider(providerOrNetwork);
    }
    //if we're setting a signer then also update that
    if (Signer.isSigner(providerOrNetwork)) {
      this.signer = providerOrNetwork;
    } else {
      this.signer = null;
    }
    this.updateModuleSigners();
    return this.providerOrSigner;
  }

  private updateModuleSigners() {
    for (let [, _module] of this.modules) {
      if (this.isReadOnly()) {
        _module.clearSigner();
      }
      _module.setProviderOrSigner(this.providerOrSigner);
    }
  }

  private getOrCreateModule<T extends AnyContract>(
    address: string,
    _Module: T,
  ): C.Instance<T> {
    if (this.modules.has(address)) {
      return this.modules.get(address) as C.Instance<T>;
    }
    const _newModule = new _Module(
      this.providerOrSigner,
      address,
      this.ipfsGatewayUrl,
    );
    this.modules.set(address, _newModule);
    return _newModule as C.Instance<T>;
  }

  public isReadOnly(): boolean {
    return !Signer.isSigner(this.signer);
  }

  public getSigner(): Signer | null {
    if (Signer.isSigner(this.signer)) {
      return this.signer;
    }
    return null;
  }

  public async getSignerAddress(): Promise<string> {
    const signer = this.getSigner();
    return (await signer?.getAddress()) ?? "";
  }

  public getControlSDK(address: string): ControlSDK {
    return this.getOrCreateModule(address, ControlSDK);
  }

  public getNFTSDK(address: string): NFTSDK {
    return this.getOrCreateModule(address, NFTSDK);
  }

  public getCollectionSDK(address: string): CollectionSDK {
    return this.getOrCreateModule(address, CollectionSDK);
  }

  public getPackSDK(address: string): PackSDK {
    return this.getOrCreateModule(address, PackSDK);
  }

  public getCurrencySDK(address: string): CurrencySDK {
    return this.getOrCreateModule(address, CurrencySDK);
  }

  public getMarketSDK(address: string): MarketSDK {
    return this.getOrCreateModule(address, MarketSDK);
  }

  public getRegistrySDK(address: string): RegistrySDK {
    return this.getOrCreateModule(address, RegistrySDK);
  }
}
