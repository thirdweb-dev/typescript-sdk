import { Networkish } from "@ethersproject/providers";
import { BaseClass } from "./classes/base";
import { SDKOptions } from "../schema/sdk-options";
import type {
  ModuleForModuleType,
  ModuleType,
  NetworkOrSignerOrProvider,
  ValidModuleClass,
} from "./types";
import { ModuleFactory } from "./classes/factory";
import { MODULES_MAP } from "../constants/mappings";
import { Registry } from "./classes/registry";
import { getModuleTypeForAddress } from "./helpers/module-type";

export class ThirdwebSDK extends BaseClass {
  /**
   * @internal
   * the cache of modules that we have already seen
   */
  private moduleCache = new Map<string, ValidModuleClass>();

  private registry: Registry;
  private factory: ModuleFactory;

  private updateModuleSignerOrProvider() {
    this.registry.updateSignerOrProvider(
      this.getSigner() || this.getProvider(),
    );
    this.factory.updateSignerOrProvider(this.getSigner() || this.getProvider());
    for (const [, module] of this.moduleCache) {
      module.updateSignerOrProvider(this.getSigner() || this.getProvider());
    }
  }

  constructor(network: NetworkOrSignerOrProvider, options?: SDKOptions) {
    super(network, options);
    this.registry = new Registry(network);
    this.factory = new ModuleFactory(network);
  }

  public override updateSignerOrProvider(network: Networkish) {
    super.updateSignerOrProvider(network);
    this.updateModuleSignerOrProvider();
  }

  /**
   *
   * @internal
   * @param address - the address of the module to instantiate
   * @param moduleType - optional, the type of module to instantiate
   * @returns a promise that resolves with the module instance
   */
  private async getModule<TModuleType extends ModuleType = ModuleType>(
    address: string,
    moduleType?: TModuleType,
  ): Promise<ModuleForModuleType<TModuleType>> {
    // if we have a module in the cache we will return it
    // we will do this **without** checking any module type things for simplicity, this may have to change in the future?
    if (this.moduleCache.has(address)) {
      return this.moduleCache.get(address) as ModuleForModuleType<TModuleType>;
    }

    // if we don't have the module type try to get it...
    if (!moduleType) {
      try {
        moduleType = await getModuleTypeForAddress<TModuleType>(
          address,
          this.getSigner() || this.getProvider(),
        );
      } catch (err) {
        // this can happen so we will only log a debug log for it
        console.debug(
          `Could not determine module type for address ${address}`,
          err,
        );
      }
    }

    let newModule: ModuleForModuleType<TModuleType>;
    // if we have a module type && the module type is part of the map
    if (moduleType && moduleType in MODULES_MAP) {
      newModule = new MODULES_MAP[
        // we have to do this as here because typescript is not smart enough to figure out
        // that the type is a key of the map (checked by the if statement above)
        moduleType as keyof typeof MODULES_MAP
      ](
        this.getNetwork(),
        this.options,
        address,
      ) as ModuleForModuleType<TModuleType>;
    } else {
      throw new Error("not a valid thirdweb module");
    }
    this.moduleCache.set(address, newModule);
    return newModule;
  }

  public async getModules<TModuleType extends ModuleType = ModuleType>(
    walletAddress: string,
    moduleTypesFilter?: TModuleType[],
  ): Promise<ModuleForModuleType<TModuleType>[]> {
    const addresses = await this.registry.getModuleAddresses(walletAddress);
    const modules = await Promise.all(
      addresses.map(
        async (address) => await this.getModule<TModuleType>(address),
      ),
    );
    return modules.filter((module) =>
      moduleTypesFilter && moduleTypesFilter.length
        ? moduleTypesFilter.includes(module.moduleType as TModuleType)
        : true,
    );
  }
}

// new ThirdwebSDK("0", { storage: new IpfsStorage() });

// BELOW ARE TYPESCRIPT SANITY CHECKS

// (async () => {
//   const sdk = new ThirdwebSDK("1", { ipfsGateway: "" });

//   // no module type whatsoever, aka we will not know what this is
//   // at runtime we will try to get the moudle type & instantiate that module but we cannot get types
//   const module = await sdk.getModule(
//     "0x1234567890123456789012345678901234567890",
//   );
//   // => typeof module = Module

//   if(module instanceof DropErc721Module){
//     // => typeof module = DropErc721Module

//   }

//   // module type is known, and we're passing it as a parameter
//   // we skip the runtime check and just intantiate it straight away
//   const nftModule = await sdk.getModule(
//     "0x1234567890123456789012345678901234567890",
//     "DropERC721",
//   );

//   // nftModule.();
//   // => typeof nftModule = NFTModule (inferred)

//   // but also works with the module type just as a type
//   // (this means we tell TS that it is a NFTModule, meaning we get the types
//   // but we will still check at runtime, so if it doesn't match then, we will throw)
//   const alsoNFTModule = await sdk.getModule<"DropERC721">(
//     "0x1234567890123456789012345678901234567890",
//   );
//   // => typeof alsoNFTModule = NFTModule (explicit)
// })();
