import { Provider } from "@ethersproject/providers";
import { parseUnits } from "@ethersproject/units";
import { BytesLike, ContractReceipt, ethers, Signer } from "ethers";
import type { C } from "ts-toolbelt";
import { getContractMetadata, uploadMetadata } from "../common";
import {
  FORWARDER_ADDRESS,
  getContractAddressByChainId,
} from "../common/address";
import { SUPPORTED_CHAIN_ID } from "../common/chain";
import { getGasPriceForChain } from "../common/gas-price";
import { invariant } from "../common/invariant";
import { AppModule } from "../modules/app";
import { BundleModule } from "../modules/bundle";
import { DatastoreModule } from "../modules/datastore";
import { DropModule } from "../modules/drop";
import { MarketModule } from "../modules/market";
import { CollectionModule } from "../modules/collection";
import { NFTModule } from "../modules/nft";
import { PackModule } from "../modules/pack";
import { SplitsModule } from "../modules/royalty";
import { CurrencyModule } from "../modules/token";
import { ModuleMetadataNoType } from "../types/ModuleMetadata";
import { IAppModule, RegistryModule } from "./registry";
import {
  ForwardRequestMessage,
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

  /**
   * Optional relayer url to be used for gasless transaction
   */
  transactionRelayerUrl: string;

  /**
   * Optional function for sending transaction to relayer
   * @returns transaction hash of relayed transaction.
   */
  transactionRelayerSendFunction: (
    message: ForwardRequestMessage,
    signature: BytesLike,
  ) => Promise<string>;

  /**
   * Optional trusted forwarder address overwrite
   */
  transactionRelayerForwarderAddress: string;

  /**
   * Optional read only RPC url
   */
  readOnlyRpcUrl: string;
}

/**
 * @internal
 */
export type AnyContract =
  | typeof AppModule
  | typeof BundleModule
  | typeof NFTModule
  | typeof CurrencyModule
  | typeof MarketModule
  | typeof PackModule
  | typeof RegistryModule
  | typeof DropModule
  | typeof DatastoreModule
  | typeof SplitsModule;

/**
 * The entrypoint to the SDK.
 * @public
 */
export class ThirdwebSDK {
  // default options
  private options: ISDKOptions;
  private defaultOptions: ISDKOptions = {
    ipfsGatewayUrl: "https://cloudflare-ipfs.com/ipfs/",
    registryContractAddress: "",
    maxGasPriceInGwei: 100,
    gasSpeed: "fastest",
    transactionRelayerUrl: "",
    transactionRelayerSendFunction: this.defaultRelayerSendFunction.bind(this),
    transactionRelayerForwarderAddress: FORWARDER_ADDRESS,
    readOnlyRpcUrl: "",
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
    this.options = {
      ...this.defaultOptions,
      ...opts,
    };
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
      this,
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
    ).readOnlyContract.forwarder();
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
   * @public
   * @returns Whether the SDK is in read-only mode. (Meaning it has not been passed a valid "Signer.")
   */
  public isReadOnly(): boolean {
    return !Signer.isSigner(this.signer);
  }

  /**
   * @public
   * @returns The contract metadata for the given contract address.
   */
  public async getContractMetadata(
    address: string,
  ): Promise<ModuleMetadataNoType> {
    return {
      ...(await getContractMetadata(
        this.providerOrSigner,
        address,
        this.options.ipfsGatewayUrl,
      )),
      address,
    };
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
   * @returns The Bundle Module.
   * @deprecated Use the new {@link getBundleModule} function instead.
   */
  public getCollectionModule(address: string): CollectionModule {
    return this.getBundleModule(address);
  }

  /**
   *
   * @param address - The contract address of the given Bundle module.
   * @returns The Bundle Module.
   */
  public getBundleModule(address: string): BundleModule {
    return this.getOrCreateModule(address, BundleModule);
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
   * @alpha
   * @param address - The contract address of the given Datastore module.
   * @returns The Datastore Module.
   */
  public getDatastoreModule(address: string): DatastoreModule {
    return this.getOrCreateModule(address, DatastoreModule);
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

  /**
   * @alpha
   *
   * @param address - The contract address of the given Royalty module.
   * @returns The Splits Module.
   */
  public getSplitsModule(address: string): SplitsModule {
    return this.getOrCreateModule(address, SplitsModule);
  }

  /**
   * Used for SDK that requires js bridging like Unity SDK.
   * Convenient function to let the caller calls into the SDK using routing scheme rather than function call.
   *
   * @internal
   * @param route - sdk execution route
   * @param payload - request arguments for the function
   * @returns
   */
  public invokeRoute(route: string, payload: Record<string, any>) {
    const parts = route.split(".");

    if (parts.length > 0 && parts[0] === "thirdweb") {
      if (parts.length === 4) {
        // thirdweb.module_name.address.function_name
        const moduleName = parts[1];
        const moduleAddress = parts[2];
        const funcName = parts[3];
        return (this.getModuleByName(moduleName, moduleAddress) as any)[
          funcName
        ](...(payload.arguments || []));
      } else if (parts.length === 3) {
        // reserved for: thirdweb.bridge.function_name
        throw new Error("reserved for thirdweb.bridge.function_name");
      } else if (parts.length === 2) {
        // main sdk functions: thirdweb.function_name
        const funcName = parts[1];
        return (this as any)[funcName](...(payload.arguments || []));
      }
    }

    throw new Error("uknown route");
  }

  // used for invoke route for unity sdk.
  private getModuleByName(name: string, address: string) {
    if (name === "currency") {
      return this.getCurrencyModule(address);
    } else if (name === "nft") {
      return this.getNFTModule(address);
    } else if (name === "market") {
      return this.getMarketModule(address);
    } else if (name === "bundle" || name === "collection") {
      return this.getCollectionModule(address);
    } else if (name === "drop") {
      return this.getDropModule(address);
    } else if (name === "splits") {
      return this.getSplitsModule(address);
    } else if (name === "pack") {
      return this.getPackModule(address);
    } else if (name === "datastore") {
      return this.getDatastoreModule(address);
    } else if (name === "app" || name === "project") {
      return this.getAppModule(address);
    }
    throw new Error("unsupported module");
  }

  private async defaultRelayerSendFunction(
    message: ForwardRequestMessage,
    signature: BytesLike,
  ): Promise<string> {
    const body = JSON.stringify({
      request: message,
      signature,
      type: "forward",
    });
    // console.log("POST", this.options.transactionRelayerUrl, body);
    const response = await fetch(this.options.transactionRelayerUrl, {
      method: "POST",
      body,
    });
    if (response.ok) {
      const resp = await response.json();
      const result = JSON.parse(resp.result);
      return result.txHash;
    }
    throw new Error("relay transaction failed");
  }
}

/**
 * Deprecated, please use ThirdwebSDK instead.
 * @public
 * @deprecated use ThirdwebSDK instead
 */
export const NFTLabsSDK = ThirdwebSDK;
