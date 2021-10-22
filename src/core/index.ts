import { Provider } from "@ethersproject/providers";
import { parseUnits } from "@ethersproject/units";
import { ContractReceipt, ethers, Signer } from "ethers";
import invariant from "ts-invariant";
import type { C } from "ts-toolbelt";
import { CollectionModule } from "../collection";
import { uploadMetadata } from "../common";
import { SUPPORTED_CHAIN_ID } from "../common/chain";
import { getGasPriceForChain } from "../common/gas-price";
import { getContractAddressByChainId } from "../common/address";
import { AppModule } from "../control";
import { CurrencyModule } from "../currency";
import { DropModule } from "../drop";
import { MarketModule } from "../market";
import { NFTModule } from "../nft";
import { PackModule } from "../pack";
import { IAppModule, RegistryModule } from "../registry";
import {
  MetadataURIOrObject,
  ProviderOrSigner,
  ValidProviderInput,
} from "./types";

/**
 * The optional options that can be passed to the SDK.
 * @public
 */
export interface ISDKOptions {
  /**
   * An optional IPFS Gateway. (Default: `https://cloudflare-ipfs.com/ipfs/`).
   */
  ipfsGatewayUrl: string;

  /**
   * Optional Registry Contract Address
   */
  registryContractAddress: string;

  /**
   * maxGasPrice for transactions
   */
  maxGasPriceInGwei: number;

  /**
   * Optional default speed setting for transactions
   */
  gasSpeed: string;
}

type AnyContract =
  | typeof AppModule
  | typeof CollectionModule
  | typeof NFTModule
  | typeof CurrencyModule
  | typeof MarketModule
  | typeof PackModule
  | typeof RegistryModule
  | typeof DropModule;

/**
 * The entrypoint to the NFTLabsSDK.
 * @public
 */
export class NFTLabsSDK {
  private options: ISDKOptions = {
    ipfsGatewayUrl: "https://cloudflare-ipfs.com/ipfs/",
    registryContractAddress: "",
    maxGasPriceInGwei: 100,
    gasSpeed: "fastest",
  };
  private modules = new Map<string, C.Instance<AnyContract>>();
  private providerOrSigner: ProviderOrSigner;

  private _signer: Signer | null = null;
  /**
   * The active Signer, you should not need to access this unless you are deploying new modules.
   * @internal
   */
  public get signer(): Signer | null {
    return this._signer;
  }
  private set signer(value: Signer | null) {
    this._signer = value;
  }

  private _registry: RegistryModule | null = null;
  private get registry(): RegistryModule | null {
    return this._registry;
  }
  private set registry(value: RegistryModule | null) {
    this._registry = value;
  }

  constructor(
    providerOrNetwork: ValidProviderInput,
    opts?: Partial<ISDKOptions>,
  ) {
    this.providerOrSigner = this.setProviderOrSigner(providerOrNetwork);
    if (opts?.ipfsGatewayUrl) {
      this.options.ipfsGatewayUrl = opts.ipfsGatewayUrl;
    }
    if (opts?.registryContractAddress) {
      this.options.registryContractAddress = opts.registryContractAddress;
    }
    if (opts?.maxGasPriceInGwei) {
      this.options.maxGasPriceInGwei = opts.maxGasPriceInGwei;
    }
    if (opts?.gasSpeed) {
      this.options.gasSpeed = opts.gasSpeed;
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

  private async getChainID(): Promise<number> {
    const provider = Provider.isProvider(this.providerOrSigner)
      ? this.providerOrSigner
      : this.providerOrSigner.provider;
    invariant(provider, "getRegistryAddress() -- No Provider");

    const { chainId } = await provider.getNetwork();
    return chainId;
  }

  private async getRegistryAddress(): Promise<string | undefined> {
    if (this.options.registryContractAddress) {
      return this.options.registryContractAddress;
    }
    return getContractAddressByChainId(
      (await this.getChainID()) as SUPPORTED_CHAIN_ID,
    );
  }
  /**
   *
   * @param address - The contract address of the given Registry module.
   * @returns The Registry Module.
   * @internal
   */
  private async getRegistryModule(): Promise<RegistryModule> {
    const address = await this.getRegistryAddress();
    invariant(address, "getRegistryModule() -- No Address");
    return (this.registry = this.getOrCreateModule(address, RegistryModule));
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
      this.options,
    );
    this.modules.set(address, _newModule);
    return _newModule as C.Instance<T>;
  }

  /**
   * you should not need this unless you are creating new modules
   * @returns the active registry module forwarder address
   * @internal
   */
  public async getForwarderAddress(): Promise<string> {
    return await (
      this.registry || (await this.getRegistryModule())
    ).contract.forwarder();
  }

  /**
   * Call this to get the current apps.
   * @returns All currently registered apps for the connected wallet
   */
  public async getApps(): Promise<IAppModule[]> {
    return (
      this.registry || (await this.getRegistryModule())
    ).getProtocolContracts();
  }

  /**
   * Call this to create a new app
   * @param metadata - metadata URI or a JSON object
   * @returns The transaction receipt
   */
  public async createApp(
    metadata: MetadataURIOrObject,
  ): Promise<ContractReceipt> {
    const registryContract = (this.registry || (await this.getRegistryModule()))
      .contract;
    const gasPrice = await this.getGasPrice();
    const txOpts: Record<string, any> = {};
    // could technically be `0` so simple falsy check does not suffice
    if (typeof gasPrice === "number") {
      txOpts.gasPrice = parseUnits(gasPrice.toString(), "gwei");
    }

    const uri = await uploadMetadata(
      metadata,
      registryContract.address,
      (await this.signer?.getAddress()) || undefined,
    );
    const txn = await registryContract.deployProtocol(uri, txOpts);

    return await txn.wait();
  }

  /**
   *
   * @param speed - what speed to prefer, default: "fastest"
   * @param maxGas - how much gas to use at most, default: 100
   * @returns the optiomal gas price
   */
  public async getGasPrice(
    speed?: string,
    maxGasGwei?: number,
  ): Promise<number | null> {
    const _speed = speed ? speed : this.options.gasSpeed;
    const _maxGas = maxGasGwei ? maxGasGwei : this.options.maxGasPriceInGwei;
    return await getGasPriceForChain(await this.getChainID(), _speed, _maxGas);
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
   * @param address - The contract address of the given Collection module.
   * @returns The Collection Module.
   */
  public getCollectionModule(address: string): CollectionModule {
    return this.getOrCreateModule(address, CollectionModule);
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
   * @param address - The contract address of the given Drop module.
   * @returns The Drop Module.
   */
  public getDropModule(address: string): DropModule {
    return this.getOrCreateModule(address, DropModule);
  }
}
