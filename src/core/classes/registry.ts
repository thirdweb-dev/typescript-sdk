import { TWRegistry, TWRegistry__factory } from "@thirdweb-dev/contracts";
import { SDKOptions } from "../../schema/sdk-options";

import { NetworkOrSignerOrProvider } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { isAddress } from "ethers/lib/utils";
import { AddressZero } from "@ethersproject/constants";
import { getBYOCTWRegistryAddress } from "../../constants";

/**
 * @internal
 */
export class ContractRegistry extends ContractWrapper<TWRegistry> {
  private byocRegistry: ContractWrapper<TWRegistry>;

  constructor(
    registryAddress: string,
    network: NetworkOrSignerOrProvider,
    options?: SDKOptions,
  ) {
    super(network, registryAddress, TWRegistry__factory.abi, options);
    this.byocRegistry = new ContractWrapper<TWRegistry>(
      network,
      getBYOCTWRegistryAddress(),
      TWRegistry__factory.abi,
      options,
    );
  }

  public async getContractAddresses(walletAddress: string) {
    // TODO @fixme the filter here is necessary because for some reason getAll returns a 0x0 address for the first entry
    return (await this.readContract.getAll(walletAddress))
      .concat(await this.byocRegistry.readContract.getAll(walletAddress))
      .filter((adr) => isAddress(adr) && adr.toLowerCase() !== AddressZero);
  }
}
