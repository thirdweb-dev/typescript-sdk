import { ContractWrapper } from "./contract-wrapper";
import { IMintableERC20, IMulticall } from "contracts";
import { Erc20 } from "./erc-20";
import { BaseERC20 } from "../../types/eips";
import { TokenMintInput } from "../../schema";
import { TransactionResult } from "../types";

export class Erc20BatchMintable {
  private contractWrapper: ContractWrapper<IMintableERC20 & IMulticall>;
  private erc20: Erc20<BaseERC20>;

  constructor(
    erc20: Erc20<BaseERC20>,
    contractWrapper: ContractWrapper<IMintableERC20 & IMulticall>,
  ) {
    this.erc20 = erc20;
    this.contractWrapper = contractWrapper;
  }

  /**
   * Mint Tokens To Many Wallets
   *
   * @remarks Mint tokens to many wallets in one transaction.
   *
   * @example
   * ```javascript
   * // Data of the tokens you want to mint
   * const data = [
   *   {
   *     toAddress: "{{wallet_address}}", // Address to mint tokens to
   *     amount: 0.2, // How many tokens to mint to specified address
   *   },
   *  {
   *    toAddress: "0x...",
   *    amount: 1.4,
   *  }
   * ]
   *
   * await contract.mintBatchTo(data);
   * ```
   */
  public async to(args: TokenMintInput[]): Promise<TransactionResult> {
    const encoded = [];
    for (const arg of args) {
      encoded.push(
        this.contractWrapper.readContract.interface.encodeFunctionData(
          "mintTo",
          [arg.toAddress, await this.erc20.normalizeAmount(arg.amount)],
        ),
      );
    }
    return { receipt: await this.contractWrapper.multiCall(encoded) };
  }
}
