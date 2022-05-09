import { TWRegistry, TWRegistry__factory } from "contracts";
import { SDKOptions } from "../../schema/sdk-options";
import { NetworkOrSignerOrProvider } from "../types";
import { ContractWrapper } from "./contract-wrapper";
import { constants, utils } from "ethers";
import { TransactionResult } from "..";

/**
 * @internal
 */
export class ContractRegistry extends ContractWrapper<TWRegistry> {
  constructor(
    registryAddress: string,
    network: NetworkOrSignerOrProvider,
    options?: SDKOptions,
  ) {
    super(network, registryAddress, TWRegistry__factory.abi, options);
  }

  public async getContractAddresses(walletAddress: string) {
    // TODO @fixme the filter here is necessary because for some reason getAll returns a 0x0 address for the first entry
    return (await this.readContract.getAll(walletAddress)).filter(
      (adr) =>
        utils.isAddress(adr) && adr.toLowerCase() !== constants.AddressZero,
    );
  }

  public async addContract(
    contractAddress: string,
  ): Promise<TransactionResult> {
    const deployerAddress = await this.getSignerAddress();
    return {
      receipt: await this.sendTransaction("add", [
        deployerAddress,
        contractAddress,
      ]),
    };
  }

  public async removeContract(
    contractAddress: string,
  ): Promise<TransactionResult> {
    const deployerAddress = await this.getSignerAddress();
    return {
      receipt: await this.sendTransaction("remove", [
        deployerAddress,
        contractAddress,
      ]),
    };
  }
}
