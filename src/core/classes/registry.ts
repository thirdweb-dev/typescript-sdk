import { TWRegistry, TWRegistry__factory } from "@3rdweb/contracts";
import { SDKOptions } from "../../schema/sdk-options";
import { TW_REGISTRY_ADDRESS } from "../../constants/addresses";
import { NetworkOrSignerOrProvider } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { isAddress } from "ethers/lib/utils";

export class ModuleRegistry extends ContractWrapper<TWRegistry> {
  constructor(network: NetworkOrSignerOrProvider, options?: SDKOptions) {
    super(network, TW_REGISTRY_ADDRESS, TWRegistry__factory.abi, options);
  }
  public async getModuleAddresses(walletAddress: string) {
    // TODO @fixme the filter here is necessary because for some reason getAllModules returns a 0x0 address for the first entry
    return (await this.readContract.getAllModules(walletAddress)).filter(
      (adr) =>
        isAddress(adr) &&
        adr.toLowerCase() !== "0x0000000000000000000000000000000000000000",
    );
  }
}
