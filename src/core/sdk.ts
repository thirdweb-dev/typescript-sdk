import { IThirdwebModule__factory } from "@3rdweb/contracts";
import { ethers } from "ethers";
import { IStorage } from "./interfaces/IStorage";
import {
  DropErc1155Module,
  DropErc721Module,
  MarketplaceModule,
  MODULES_MAP,
  SplitsModule,
  TokenErc20Module,
  VoteModule,
} from "../modules";
import { SDKOptions } from "../schema/sdk-options";
import { ModuleFactory } from "./classes/factory";
import { IpfsStorage } from "./classes/ipfs-storage";
import { RPCConnectionHandler } from "./classes/rpc-connection-handler";
import type {
  ModuleForModuleType,
  ModuleType,
  NetworkOrSignerOrProvider,
  ValidModuleClass,
  ValidModuleInstance,
} from "./types";
import { TokenErc721Module } from "../modules/token-erc-721";
import { TokenErc1155Module } from "../modules/token-erc-1155";
import { ModuleRegistry } from "./classes/registry";
import { PacksModule } from "../modules/packs";
import { getContractAddressByChainId } from "../constants/addresses";
import { z } from "zod";

export class ThirdwebSDK extends RPCConnectionHandler {
  /**
   * @internal
   * the cache of modules that we have already seen
   */
  private moduleCache = new Map<string, ValidModuleInstance>();
  /**
   * @internal
   * should never be accessed directly, use {@link getFactory} instead
   */
  private _factory: Promise<ModuleFactory> | undefined;
  /**
   * @internal
   * should never be accessed directly, use {@link getRegistry} instead
   */
  private _registry: Promise<ModuleRegistry> | undefined;

  public storage: IStorage;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions,
    storage: IStorage = new IpfsStorage(),
  ) {
    super(network, options);
    // this.factory = new ModuleFactory(network, storage, options);
    // this.registry = new ModuleRegistry(network, options);
    this.storage = storage;
  }

  private async getRegistry(): Promise<ModuleRegistry> {
    // if we already have a registry just return it back
    if (this._registry) {
      return this._registry;
    }
    // otherwise get the registry address for the active chain and get a new one
    const chainId = (await this.getProvider().getNetwork()).chainId;
    const registryAddress = getContractAddressByChainId(chainId, "twRegistry");
    return (this._registry = Promise.resolve(
      new ModuleRegistry(registryAddress, this.getNetwork(), this.options),
    ));
  }

  private async getFactory(): Promise<ModuleFactory> {
    // if we already have a factory just return it back
    if (this._factory) {
      return this._factory;
    }
    // otherwise get the factory address for the active chain and get a new one
    const chainId = (await this.getProvider().getNetwork()).chainId;
    const factoryAddress = getContractAddressByChainId(chainId, "twFactory");
    return (this._factory = Promise.resolve(
      new ModuleFactory(
        factoryAddress,
        this.getNetwork(),
        this.storage,
        this.options,
      ),
    ));
  }

  /**
   * Deploys a new module
   *
   * @param moduleType - the type of module to deploy
   * @param moduleMetadata - the metadata to deploy the module with
   * @returns a promise of the address of the newly deployed module
   */
  public async deployModule<TModule extends ValidModuleClass>(
    moduleType: TModule["moduleType"],
    moduleMetadata: z.input<TModule["schema"]["deploy"]>,
  ): Promise<string> {
    const factory = await this.getFactory();
    return await factory.deploy(moduleType, moduleMetadata);
  }

  /**
   *
   * @param moduleAddress - the address of the module to attempt to resolve the module type for
   * @returns the {@link ModuleType} for the given module address
   * @throws if the module type cannot be determined (is not a valid thirdweb module)
   */
  public async resolveModuleType<TModuleType extends ModuleType>(
    moduleAddress: string,
  ) {
    const contract = IThirdwebModule__factory.connect(
      moduleAddress,
      this.options.readOnlyRpcUrl
        ? ethers.getDefaultProvider(this.options.readOnlyRpcUrl)
        : this.getProvider(),
    );
    return (
      ethers.utils
        .toUtf8String(await contract.moduleType())
        // eslint-disable-next-line no-control-regex
        .replace(/\x00/g, "") as TModuleType
    );
  }

  public async getModuleList(walletAddress: string) {
    const addresses = await (
      await this.getRegistry()
    ).getModuleAddresses(walletAddress);

    const addressesWithModuleTypes = await Promise.all(
      addresses.map(async (adrr) => ({
        address: adrr,
        moduleType: await this.resolveModuleType(adrr).catch((err) => {
          console.error(`failed to get module type for address: ${adrr}`, err);
          return "DropERC721" as ModuleType;
        }),
      })),
    );

    return addressesWithModuleTypes.map(({ address, moduleType }) => ({
      address,
      moduleType,
      metadata: () => this.getModule(address, moduleType).metadata.get(),
    }));
  }

  /**
   *
   * @internal
   * @param address - the address of the module to instantiate
   * @param moduleType - optional, the type of module to instantiate
   * @returns a promise that resolves with the module instance
   */
  public getModule<TModuleType extends ModuleType = ModuleType>(
    address: string,
    moduleType: TModuleType,
  ) {
    // if we have a module in the cache we will return it
    // we will do this **without** checking any module type things for simplicity, this may have to change in the future?
    if (this.moduleCache.has(address)) {
      return this.moduleCache.get(address) as ModuleForModuleType<TModuleType>;
    }
    const newModule = new MODULES_MAP[
      // we have to do this as here because typescript is not smart enough to figure out
      // that the type is a key of the map (checked by the if statement above)
      moduleType as keyof typeof MODULES_MAP
    ](this.getNetwork(), address, this.storage, this.options);
    // if we have a module type && the module type is part of the map

    this.moduleCache.set(address, newModule);

    // return the new module
    return newModule;
  }

  /**
   * Get an instance of a Drop module
   * @param moduleAddress - the address of the deployed module
   * @returns the module
   */
  public getDropModule(moduleAddress: string): DropErc721Module {
    return this.getModule(
      moduleAddress,
      DropErc721Module.moduleType,
    ) as DropErc721Module;
  }

  /**
   * Get an instance of a NFT Collection module
   * @param address - the address of the deployed module
   * @returns the module
   */
  public getNFTModule(address: string): TokenErc721Module {
    return this.getModule(
      address,
      TokenErc721Module.moduleType,
    ) as TokenErc721Module;
  }

  /**
   * Get an instance of a Bundle Drop module
   * @param address - the address of the deployed module
   * @returns the module
   */
  public getBundleDropModule(address: string): DropErc1155Module {
    return this.getModule(
      address,
      DropErc1155Module.moduleType,
    ) as DropErc1155Module;
  }

  /**
   * Get an instance of a Bundle module
   * @param address - the address of the deployed module
   * @returns the module
   */
  public getBundleModule(address: string): TokenErc1155Module {
    return this.getModule(
      address,
      TokenErc1155Module.moduleType,
    ) as TokenErc1155Module;
  }

  /**
   * Get an instance of a Token module
   * @param address - the address of the deployed module
   * @returns the module
   */
  public getTokenModule(address: string): TokenErc20Module {
    return this.getModule(
      address,
      TokenErc20Module.moduleType,
    ) as TokenErc20Module;
  }

  /**
   * Get an instance of a Vote module
   * @param address - the address of the deployed module
   * @returns the module
   */
  public getVoteModule(address: string): VoteModule {
    return this.getModule(address, VoteModule.moduleType) as VoteModule;
  }

  /**
   * Get an instance of a Splits module
   * @param address - the address of the deployed module
   * @returns the module
   */
  public getSplitsModule(address: string): SplitsModule {
    return this.getModule(address, SplitsModule.moduleType) as SplitsModule;
  }

  /**
   * Get an instance of a Marketplace module
   * @param address - the address of the deployed module
   * @returns the module
   */
  public getMarketplaceModule(address: string): MarketplaceModule {
    return this.getModule(
      address,
      MarketplaceModule.moduleType,
    ) as MarketplaceModule;
  }

  /**
   * Get an instance of a Pack module
   * @param address - the address of the deployed module
   * @returns the module
   */
  public getPackModule(address: string): PacksModule {
    return this.getModule(address, PacksModule.moduleType) as PacksModule;
  }

  /**
   * Update the active signer or provider for all modules
   * @param network - the new signer or provider
   */
  public override updateSignerOrProvider(network: NetworkOrSignerOrProvider) {
    super.updateSignerOrProvider(network);
    this.updateModuleSignerOrProvider();
  }

  private updateModuleSignerOrProvider() {
    // has to be promises now
    this._factory?.then((factory) => {
      factory.updateSignerOrProvider(this.getSigner() || this.getProvider());
    });
    // has to be promises now
    this._registry?.then((registry) => {
      registry.updateSignerOrProvider(this.getSigner() || this.getProvider());
    });

    for (const [, module] of this.moduleCache) {
      module.onNetworkUpdated(this.getSigner() || this.getProvider());
    }
  }
}

// BELOW ARE TYPESCRIPT SANITY CHECKS

// (async () => {
//   const sdk = new ThirdwebSDK("1");

//   const dropModule = sdk.getDropModule("0x0");
//   // metadata
//   const metadata = await dropModule.metadata.get();
//   const updated = await dropModule.metadata.update({
//     name: "foo",
//     seller_fee_basis_points: 1,
//   });
//   const transaction = updated.transaction;
//   const data = await updated.metadata();

//   // roles
//   const roles = await dropModule.roles.getAllMembers();
//   const adminAddrs = await dropModule.roles.getRoleMembers("admin");

//   // royalty
//   const royalty = await dropModule.royalty.getRoyaltyInfo();

//   const updatedRoyalty = await dropModule.royalty.setRoyaltyInfo({
//     fee_recipient: "0x0",
//     seller_fee_basis_points: 500,
//   });

//   const transaction2 = updatedRoyalty.transaction;
//   // metadata key doesn't really make sense here? hm.
//   const data2 = await updatedRoyalty.metadata();
// })();
