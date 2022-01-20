import { ThirdwebRegistry, ThirdwebRegistry__factory } from "@3rdweb/contracts";
import { SDKOptions } from "../../schema/sdk-options";
import { TW_FACTORY_ADDRESS } from "../../constants/addresses";
import { NetworkOrSignerOrProvider } from "../types";
import { ContractWrapper } from "./contract-wrapper";

export class Registry extends ContractWrapper<ThirdwebRegistry> {
  constructor(network: NetworkOrSignerOrProvider, options?: SDKOptions) {
    super(network, options, TW_FACTORY_ADDRESS, ThirdwebRegistry__factory.abi);
  }

  public async getModuleAddresses(walletAddress: string): Promise<string[]> {
    console.debug("getModuleAddresses", walletAddress);
    return [];

    // TODO implement this properly
    // return await this.contract.getAllModulesOfType(
    //   moduleTypesFilter,
    //   walletAddress,
    // );
  }
}
