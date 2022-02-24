import { ContractWrapper } from "./contract-wrapper";
import { BaseContract, ethers } from "ethers";

/**
 * Estimates the gas cost of Contract calls
 * @public
 */
export class GasCostEstimator<TContract extends BaseContract> {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  /**
   * Estimates the cost of gas in native token of the current chain
   * @returns the estimated price in native currency (ETH, MATIC, etc) of calling this function
   */
  public async gasCostOf(
    fn: keyof TContract["functions"],
    args: Parameters<TContract["functions"][typeof fn]>,
  ): Promise<string> {
    const price = await this.contractWrapper.getPreferredGasPrice();
    const gasUnits = await this.contractWrapper.estimateGas(fn, args);
    return ethers.utils.formatEther(gasUnits.mul(price));
  }

  /**
   * Returns the current gas price in gwei
   */
  public async currentGasPriceInGwei(): Promise<string> {
    const price = await this.contractWrapper.getProvider().getGasPrice();
    return ethers.utils.formatUnits(price, "gwei");
  }
}
