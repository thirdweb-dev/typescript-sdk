import { Provider } from "@ethersproject/providers";
import { ethers, Signer } from "ethers";
import type { C } from "ts-toolbelt";
import { CollectionModule } from "../collection";
import { AppModule } from "../control";
import { CurrencyModule } from "../currency";
import { MarketModule } from "../market";
import { NFTModule } from "../nft";
import { PackModule } from "../pack";
import { RegistryModule } from "../registry";
import { ProviderOrSigner, ValidProviderInput } from "./types";

/**
 * The optional options that can be passed to the SDK.
 * @public
 */
export interface ISDKOptions {
  /**
   * An optional IPFS Gateway. (Default: `https://cloudflare-ipfs.com/ipfs/`).
   */
  ipfsGatewayUrl?: string;
}

type AnyContract =
  | typeof AppModule
  | typeof CollectionModule
  | typeof NFTModule
  | typeof CurrencyModule
  | typeof MarketModule
  | typeof PackModule
  | typeof RegistryModule;

/**
 * The entrypoint to the NFTLabsSDK.
 * @public
 */
export class NFTLabsSDK {
  private ipfsGatewayUrl = "https://cloudflare-ipfs.com/ipfs/";
  private modules = new Map<string, C.Instance<AnyContract>>();
  private providerOrSigner: ProviderOrSigner;
  private signer: Signer | null = null;

  constructor(
    providerOrNetwork: ValidProviderInput,
    opts?: Partial<ISDKOptions>,
  ) {
    this.providerOrSigner = this.setProviderOrSigner(providerOrNetwork);
    if (opts?.ipfsGatewayUrl) {
      this.ipfsGatewayUrl = opts.ipfsGatewayUrl;
    }
  }
  private updateModuleSigners() {
    for (const [, _module] of this.modules) {
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
  /**
   *
   * @param providerOrSignerOrNetwork - A valid "ethers" Provider, Signer or a Network address to create a Provider with.
   * @returns The Provider / Signer that was passed in, or a default ethers provider constructed with the passed Network.
   */
  public setProviderOrSigner(providerOrSignerOrNetwork: ValidProviderInput) {
    if (
      Provider.isProvider(providerOrSignerOrNetwork) ||
      Signer.isSigner(providerOrSignerOrNetwork)
    ) {
      // sdk instantiated with a provider / signer
      this.providerOrSigner = providerOrSignerOrNetwork;
    } else {
      // sdk instantiated with a network name / network url
      this.providerOrSigner = ethers.getDefaultProvider(
        providerOrSignerOrNetwork,
      );
    }
    // if we're setting a signer then also update that
    if (Signer.isSigner(providerOrSignerOrNetwork)) {
      this.signer = providerOrSignerOrNetwork;
    } else {
      this.signer = null;
    }
    this.updateModuleSigners();
    return this.providerOrSigner;
  }

  /**
   *
   * @returns Whether the SDK is in read-only mode. (Meaning it has not been passed a valid "Signer.")
   */
  public isReadOnly(): boolean {
    return !Signer.isSigner(this.signer);
  }

  /**
   *
   * @param address - The contract address of the given App module.
   * @returns The App Module.
   */
  public getAppModule(address: string): AppModule {
    return this.getOrCreateModule(address, AppModule);
  }

  /**
   *
   * @param address - The contract address of the given NFT module.
   * @returns The NFT Module.
   */
  public getNFTModule(address: string): NFTModule {
    return this.getOrCreateModule(address, NFTModule);
  }

  /**
   *
   * @param address - The contract address of the given Pack module.
   * @returns The Pack Module.
   */
  public getPackModule(address: string): PackModule {
    return this.getOrCreateModule(address, PackModule);
  }

  /**
   *
   * @param address - The contract address of the given Currency module.
   * @returns The Currency Module.
   */
  public getCurrencyModule(address: string): CurrencyModule {
    return this.getOrCreateModule(address, CurrencyModule);
  }

  /**
   *
   * @param address - The contract address of the given Market module.
   * @returns The Market Module.
   */
  public getMarketModule(address: string): MarketModule {
    return this.getOrCreateModule(address, MarketModule);
  }

  /**
   *
   * @param address - The contract address of the given Registry module.
   * @returns The Registry Module.
   */
  public getRegistryModule(address: string): RegistryModule {
    return this.getOrCreateModule(address, RegistryModule);
  }
}
