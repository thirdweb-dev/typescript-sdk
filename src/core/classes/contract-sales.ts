import { IThirdwebPrimarySale } from "@3rdweb/contracts";
import { ContractWrapper } from "./contract-wrapper";
import { TransactionResultPromise } from "../types";

export class ContractPrimarySale<TContract extends IThirdwebPrimarySale> {
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
  public async setRecipient(recipient: string): TransactionResultPromise {
    return {
      receipt: await this.contractWrapper.sendTransaction(
        "setPrimarySaleRecipient",
        [recipient],
      ),
    };
  }
}
