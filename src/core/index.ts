import { Provider } from "@ethersproject/providers";
import { BytesLike, ethers, Signer } from "ethers";
import { JsonConvert } from "json2typescript";
import MerkleTree from "merkletreejs";
import type { C } from "ts-toolbelt";
import { DuplicateLeafsError, ModuleType } from "../common";
import {
  FORWARDER_ADDRESS,
  getContractAddressByChainId,
} from "../common/address";
import { SUPPORTED_CHAIN_ID } from "../common/chain";
import { getGasPriceForChain } from "../common/gas-price";
import { invariant } from "../common/invariant";
import { ISDKOptions, IThirdwebSdk } from "../interfaces";
import { IStorage } from "../interfaces/IStorage";
import { BundleModule } from "../modules/bundle";
import { BundleDropModule } from "../modules/bundleDrop";
import { DropModule } from "../modules/drop";
import { MarketplaceModule } from "../modules/marketplace";
import { NFTModule } from "../modules/nft";
import { PackModule } from "../modules/pack";
import { SplitsModule } from "../modules/royalty";
import { TokenModule } from "../modules/token";
import { VoteModule } from "../modules/vote";
import { IpfsStorage } from "../storage/IpfsStorage";
import { ModuleMetadata } from "../types/ModuleMetadata";
import { ClaimProof, Snapshot, SnapshotInfo } from "../types/snapshots";
import { RegistryModule } from "./registry";
import {
  ForwardRequestMessage,
  PermitRequestMessage,
  ProviderOrSigner,
  ValidProviderInput,
} from "./types";

/**
 * @internal
 */
export type AnyContract =
  | typeof BundleModule
  | typeof NFTModule
  | typeof PackModule
  | typeof DropModule
  | typeof SplitsModule
  | typeof BundleDropModule
  | typeof MarketplaceModule
  | typeof TokenModule
  | typeof RegistryModule
  | typeof VoteModule;

/**
 * The entrypoint to the SDK.
 * @public
 */
export class ThirdwebSDK implements IThirdwebSdk {
  // default options
  private options: ISDKOptions;
  private defaultOptions: ISDKOptions = {
    ipfsGatewayUrl: "https://cloudflare-ipfs.com/ipfs/",
    registryContractAddress: "",
    maxGasPriceInGwei: 300,
    gasSpeed: "fastest",
    transactionRelayerUrl: "",
    transactionRelayerSendFunction: this.defaultRelayerSendFunction.bind(this),
    transactionRelayerForwarderAddress: FORWARDER_ADDRESS,
    readOnlyRpcUrl: "",
  };
  private modules = new Map<string, C.Instance<AnyContract>>();
  private providerOrSigner: ProviderOrSigner;

  private _signer: Signer | null = null;

  private _jsonConvert = new JsonConvert();
  private storage: IStorage;

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
    this.storage = new IpfsStorage(this.options.ipfsGatewayUrl);
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
   * Call this to get the current apps.
   * @returns All currently registered apps for the connected wallet
   */
  public async getModules(
    address: string,
    filterByModuleType?: ModuleType[],
  ): Promise<ModuleMetadata[]> {
    return (this.registry || (await this.getRegistryModule())).getModules(
      address,
      filterByModuleType,
    );
  }

  /**
   *
   * @param speed - what speed to prefer, default: "fastest"
   * @param maxGas - how much gas to use at most, default: 300
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
   *
   * @param address - The contract address of the given NFT module.
   * @returns The NFT Module.
   */
  public getNFTModule(address: string): NFTModule {
    return this.getOrCreateModule(address, NFTModule);
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
   * @param address - The contract address of the given Token module.
   * @returns The Token Module.
   */
  public getTokenModule(address: string): TokenModule {
    return this.getOrCreateModule(address, TokenModule);
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
   * @beta
   *
   * @param address - The contract address of the given BundleDrop module.
   * @returns The Drop Module.
   */
  public getBundleDropModule(address: string): BundleDropModule {
    return this.getOrCreateModule(address, BundleDropModule);
  }

  /**
   * @beta
   *
   * @param address - The contract address of the given Marketplace module.
   * @returns The Marketplace Module.
   */
  public getMarketplaceModule(address: string): MarketplaceModule {
    return this.getOrCreateModule(address, MarketplaceModule);
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
   * @alpha
   *
   * @param address - The contract address of the given Vote module.
   * @returns The Vote Module.
   */
  public getVoteModule(address: string): VoteModule {
    return this.getOrCreateModule(address, VoteModule);
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
    if (name === "token") {
      return this.getTokenModule(address);
    } else if (name === "nft") {
      return this.getNFTModule(address);
    } else if (name === "marketplace") {
      return this.getMarketplaceModule(address);
    } else if (name === "bundle") {
      return this.getBundleModule(address);
    } else if (name === "drop") {
      return this.getDropModule(address);
    } else if (name === "splits") {
      return this.getSplitsModule(address);
    } else if (name === "pack") {
      return this.getPackModule(address);
    }
    throw new Error("unsupported module");
  }

  private async defaultRelayerSendFunction(
    message: ForwardRequestMessage | PermitRequestMessage,
    signature: BytesLike,
  ): Promise<string> {
    let messageType = "forward";

    // if has owner property then it's permit :)
    if ((message as PermitRequestMessage)?.owner) {
      messageType = "permit";
    }

    const body = JSON.stringify({
      request: message,
      signature,
      type: messageType,
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

  public async createSnapshot(leafs: string[]): Promise<SnapshotInfo> {
    const hasDuplicates = new Set(leafs).size < leafs.length;
    if (hasDuplicates) {
      throw new DuplicateLeafsError();
    }

    const { default: keccak256 } = await import("keccak256");

    const hashedLeafs = leafs.map((l) => keccak256(l));
    const tree = new MerkleTree(hashedLeafs, keccak256, {
      sort: true,
    });

    const snapshot: Snapshot = {
      merkleRoot: tree.getHexRoot(),
      claims: leafs.map((l): ClaimProof => {
        const proof = tree.getHexProof(keccak256(l));
        return {
          address: l,
          proof,
        };
      }),
    };

    const serializedSnapshot = JSON.stringify(
      this._jsonConvert.serializeObject(snapshot, Snapshot),
    );
    const uri = await this.storage.upload(serializedSnapshot);

    return {
      merkleRoot: tree.getHexRoot(),
      snapshotUri: uri,
      snapshot,
    };
  }

  /**
   * Accessor for the storage instance used by the SDK
   *
   * @returns - The Storage instance.
   */
  public getStorage(): IStorage {
    return this.storage;
  }

  /**
   * Allows you to override the storage used across the SDK.
   *
   * @param storage - The Storage instance to use.
   */
  public overrideStorage(storage: IStorage): void {
    this.storage = storage;
  }
}
