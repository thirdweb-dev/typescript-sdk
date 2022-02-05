import { ContractWrapper } from "./contract-wrapper";
import { BaseContract } from "ethers";

export class ContractEncoder<TContract extends BaseContract> {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  /**
   * Encodes the given contract function with argument
   * @returns the encoded data
   */
  public encode(
    fn: keyof TContract["functions"],
    args: Parameters<TContract["functions"][typeof fn]>,
  ): string {
    return this.contractWrapper.readContract.interface.encodeFunctionData(
      fn as string,
      args,
    );
  }
}
