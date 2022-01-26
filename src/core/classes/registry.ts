import { TWRegistry, TWRegistry__factory } from "@3rdweb/contracts";
import { SDKOptions } from "../../schema/sdk-options";
import { TW_FACTORY_ADDRESS } from "../../constants/addresses";
import { NetworkOrSignerOrProvider } from "../types";
import { ContractWrapper } from "./contract-wrapper";

export class Registry extends ContractWrapper<TWRegistry> {
  constructor(network: NetworkOrSignerOrProvider, options?: SDKOptions) {
    super(network, options, TW_FACTORY_ADDRESS, TWRegistry__factory.abi);
  }

  public async getModuleAddresses(walletAddress: string) {
    return this.readContract.getAllModules(walletAddress);
  }
}
