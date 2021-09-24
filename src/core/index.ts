import { Provider } from "@ethersproject/providers";
import { ethers, Signer } from "ethers";
import type { C } from "ts-toolbelt";
import { CoinSDK } from "../coin";
import { ControlSDK } from "../control";
import { MarketSDK } from "../market";
import { NFTSDK } from "../nft";
import { PackSDK } from "../pack";
import { RegistrySDK } from "../registry";
import { ProviderOrSigner, ValidProviderInput } from "./types";

/**
 * The optional options that can be passed to the SDK.
 */
export interface ISDKOptions {
  /**
   * An optional IPFS Gateway. (Default: `https://cloudflare-ipfs.com/ipfs/`).
   */
  ipfsGatewayUrl?: string;
}

type AnyContract =
  | typeof ControlSDK
  | typeof NFTSDK
  | typeof CoinSDK
  | typeof MarketSDK
  | typeof PackSDK
  | typeof RegistrySDK;

/**
 * @public
 * The entrypoint to the NFTLabsSDK
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
  public getAppModule(address: string): ControlSDK {
    return this.getOrCreateModule(address, ControlSDK);
  }

  /**
   *
   * @param address - The contract address of the given NFT module.
   * @returns The NFT Module.
   */
  public getNFTModule(address: string): NFTSDK {
    return this.getOrCreateModule(address, NFTSDK);
  }

  /**
   *
   * @param address - The contract address of the given Pack module.
   * @returns The Pack Module.
   */
  public getPackModule(address: string): PackSDK {
    return this.getOrCreateModule(address, PackSDK);
  }

  /**
   *
   * @param address - The contract address of the given Coin module.
   * @returns The Coin Module.
   */
  public getCoinModule(address: string): CoinSDK {
    return this.getOrCreateModule(address, CoinSDK);
  }

  /**
   *
   * @param address - The contract address of the given Market module.
   * @returns The Market Module.
   */
  public getMarketModule(address: string): MarketSDK {
    return this.getOrCreateModule(address, MarketSDK);
  }

  /**
   *
   * @param address - The contract address of the given Registry module.
   * @returns The Registry Module.
   */
  public getRegistrySDK(address: string): RegistrySDK {
    return this.getOrCreateModule(address, RegistrySDK);
  }
}
