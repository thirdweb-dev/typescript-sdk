import { ContractWrapper } from "./contract-wrapper";
import { IMintableERC20, Multicall } from "contracts";
import { TransactionResult } from "../types";
import { detectContractFeature } from "../../common";
import { BaseERC20 } from "../../types/eips";
import { Erc20 } from "./erc-20";
import { Amount } from "../../types";
import { Erc20BatchMintable } from "./erc-20-batch-mintable";

export class Erc20Mintable {
  private contractWrapper: ContractWrapper<IMintableERC20>;
  private erc20: Erc20<BaseERC20>;

  /**
   * Batch mint Tokens to many addresses
   */
  public batch: Erc20BatchMintable | undefined;

  constructor(
    erc20: Erc20<BaseERC20>,
    contractWrapper: ContractWrapper<IMintableERC20>,
  ) {
    this.erc20 = erc20;
    this.contractWrapper = contractWrapper;
    this.batch = this.detectErc20BatchMintable();
  }

  /**
   * Mint Tokens
   *
   * @remarks Mint tokens to a specified address.
   *
   * @example
   * ```javascript
   * const toAddress = "{{wallet_address}}"; // Address of the wallet you want to mint the tokens to
   * const amount = "1.5"; // The amount of this token you want to mint
   *
   * await contract.mintTo(toAddress, amount);
   * ```
   */
  public async to(to: string, amount: Amount): Promise<TransactionResult> {
    return {
      receipt: await this.contractWrapper.sendTransaction("mintTo", [
        to,
        await this.erc20.normalizeAmount(amount),
      ]),
    };
  }

  private detectErc20BatchMintable() {
    if (
      detectContractFeature<IMintableERC20 & Multicall>(
        this.contractWrapper,
        "ERC20BatchMintable",
      )
    ) {
      return new Erc20BatchMintable(this.erc20, this.contractWrapper);
    }
    return undefined;
  }
}
