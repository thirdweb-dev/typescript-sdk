import { TWRegistry, TWRegistry__factory } from "@3rdweb/contracts";
import { SDKOptions } from "../../schema/sdk-options";
import { TW_FACTORY_ADDRESS } from "../../constants/addresses";
import { NetworkOrSignerOrProvider } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { getModuleTypeForAddress } from "../helpers/module-type";
import { ethers } from "ethers";

export class ModuleRegistry extends ContractWrapper<TWRegistry> {
  constructor(network: NetworkOrSignerOrProvider, options?: SDKOptions) {
    super(network, TW_FACTORY_ADDRESS, TWRegistry__factory.abi, options);
  }
  public async getModuleAddresses(walletAddress: string) {
    const addresses = await this.readContract.getAllModules(walletAddress);
    return await Promise.all(
      addresses.map(async (address) => ({
        address,
        moduleType: await getModuleTypeForAddress(
          address,
          this.options.readOnlyRpcUrl
            ? ethers.getDefaultProvider(this.options.readOnlyRpcUrl)
            : this.getSigner() || this.getProvider(),
        ),
      })),
    );
  }
}
