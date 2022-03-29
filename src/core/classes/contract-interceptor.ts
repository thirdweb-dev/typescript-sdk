import { ContractWrapper } from "./contract-wrapper";
import { BaseContract } from "ethers";
import { CallOverrides } from "@ethersproject/contracts";

/**
 * Allows overriding transaction behavior for this contract
 * @internal
 */
export class ContractInterceptor<TContract extends BaseContract> {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  /**
   * The next transaction executed will add/replace any overrides passed via the passed in hook.
   * @param hook - the hook to add or replace any CallOverrides (gas limit, gas price, nonce, from, value, etc...)
   */
  public overrideNextTransaction(hook: () => CallOverrides) {
    this.contractWrapper.withTransactionOverride(hook);
  }
}
