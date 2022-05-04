import { IPrimarySale } from "contracts";
import { ContractWrapper } from "./contract-wrapper";
import { TransactionResult } from "../types";
import { FEATURE_PRIMARY_SALE } from "../../constants/thirdweb-features";

/**
 * Handles primary sales recipients for a Contract
 * @public
 */
export class ContractPrimarySale<TContract extends IPrimarySale> {
  featureName = FEATURE_PRIMARY_SALE.name;
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TContract>) {
    this.contractWrapper = contractWrapper;
  }

  /**
   * Get the primary sale recipient.
   * @returns the wallet address.
   */
  public async getRecipient(): Promise<string> {
    return await this.contractWrapper.readContract.primarySaleRecipient();
  }

  /**
   * Set the primary sale recipient
   * @param recipient - the wallet address
   */
  public async setRecipient(recipient: string): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "setPrimarySaleRecipient",
        [recipient],
      ),
    };
  }
}
