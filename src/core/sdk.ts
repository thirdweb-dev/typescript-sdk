import { IThirdwebModule__factory } from "@3rdweb/contracts";
import { ethers } from "ethers";
import { IStorage } from "./interfaces/IStorage";
import { DropErc1155Module, DropErc721Module, MODULES_MAP } from "../modules";
import { SDKOptions } from "../schema/sdk-options";
import { ModuleFactory } from "./classes/factory";
import { IpfsStorage } from "./classes/ipfs-storage";
import { RPCConnectionHandler } from "./classes/rpc-connection-handler";
import type {
  ModuleForModuleType,
  ModuleType,
  NetworkOrSignerOrProvider,
  ValidModuleInstance,
} from "./types";
import { TokenErc721Module } from "../modules/token-erc-721";
import { TokenErc1155Module } from "../modules/token-erc-1155";

export class ThirdwebSDK extends RPCConnectionHandler {
  /**
   * @internal
   * the cache of modules that we have already seen
   */
  private moduleCache = new Map<string, ValidModuleInstance>();

  // private moduleFactory: TWFactory;
  public factory: ModuleFactory;

  public storage: IStorage;

  constructor(
    network: NetworkOrSignerOrProvider,
    options: SDKOptions,
    storage: IStorage = new IpfsStorage(),
  ) {
    super(network, options);
    this.factory = new ModuleFactory(network, storage, options);
    this.storage = storage;
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
    return (await contract.moduleType()) as TModuleType;
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
   * Update the active signer or provider for all modules
   * @param network - the new signer or provider
   */
  public override updateSignerOrProvider(network: NetworkOrSignerOrProvider) {
    super.updateSignerOrProvider(network);
    this.updateModuleSignerOrProvider();
  }

  private updateModuleSignerOrProvider() {
    this.factory.updateSignerOrProvider(this.getSigner() || this.getProvider());
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
