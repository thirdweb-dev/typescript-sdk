import { TWRegistry, TWRegistry__factory } from "contracts";
import { SDKOptions } from "../../schema/sdk-options";

import { NetworkOrSignerOrProvider } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { isAddress } from "ethers/lib/utils";
import { constants } from "ethers";

/**
 * @internal
 */
export class ContractRegistry extends ContractWrapper<TWRegistry> {
  private byocRegistry: ContractWrapper<TWRegistry>;

  constructor(
    registryAddress: string,
    byocRegistryAddress: string,
    network: NetworkOrSignerOrProvider,
    options?: SDKOptions,
  ) {
    super(network, registryAddress, TWRegistry__factory.abi, options);
    this.byocRegistry = new ContractWrapper<TWRegistry>(
      network,
      byocRegistryAddress,
      TWRegistry__factory.abi,
      options,
    );
  }

  public async getContractAddresses(walletAddress: string) {
    let byocContracts: string[] = [];
    try {
      byocContracts = await this.byocRegistry.readContract.getAll(
        walletAddress,
      );
    } catch (e) {
      // ignore
    }
    // TODO @fixme the filter here is necessary because for some reason getAll returns a 0x0 address for the first entry
    return (await this.readContract.getAll(walletAddress))
      .concat(byocContracts)
      .filter(
        (adr) => isAddress(adr) && adr.toLowerCase() !== constants.AddressZero,
      );
  }
}
