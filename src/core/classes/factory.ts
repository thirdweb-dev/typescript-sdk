import { TWFactory, TWFactory__factory } from "@3rdweb/contracts";
import { SDKOptions } from "../../schema/sdk-options";
import { TW_FACTORY_ADDRESS } from "../../constants/addresses";
import { ModuleType, NetworkOrSignerOrProvider } from "../types";
import { ContractWrapper } from "./contract-wrapper";

export class ModuleFactory extends ContractWrapper<TWFactory> {
  constructor(network: NetworkOrSignerOrProvider, options?: SDKOptions) {
    super(network, options, TW_FACTORY_ADDRESS, TWFactory__factory.abi);
  }

  public async deploy<TModuleType extends ModuleType>(
    moduleType: TModuleType,
    moduleMetadata: any,
  ) {
    const contractURI = await this.options.storage.uploadMetadata(
      moduleMetadata,
      this.contract.address,
      await this.getSigner()?.getAddress(),
    );
    console.debug("getModuleAddresses", moduleType, contractURI);
  }
}
