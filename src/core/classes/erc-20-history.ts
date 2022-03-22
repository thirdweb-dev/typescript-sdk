import { ContractWrapper } from "./contract-wrapper";
import { BigNumber } from "ethers";
import { TokenERC20 } from "@thirdweb-dev/contracts";
import { AddressZero } from "@ethersproject/constants";

/**
 * Manages claim conditions for Edition Drop contracts
 * @public
 */
export class TokenERC20History {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<TokenERC20>) {
    this.contractWrapper = contractWrapper;
  }

  /** ***************************************
   * READ FUNCTIONS
   *****************************************/

  /**
   * Lets you get a all token holders and their corresponding balances
   * @beta - This can be very slow for large numbers of token holders
   * @param queryParams - Optional query params
   * @returns - A JSON object of all token holders and their corresponding balances
   */
  public async getAllHolderBalances(): Promise<Record<string, BigNumber>> {
    const a = await this.contractWrapper.readContract.queryFilter(
      this.contractWrapper.readContract.filters.Transfer(),
    );
    const txns = a.map((b) => b.args);
    const balances: {
      [key: string]: BigNumber;
    } = {};
    txns.forEach((item) => {
      const from = item.from;
      const to = item.to;
      const amount = item.value;

      if (!(from === AddressZero)) {
        if (!(from in balances)) {
          balances[from] = BigNumber.from(0);
        }
        balances[from] = balances[from].sub(amount);
      }
      if (!(to === AddressZero)) {
        if (!(to in balances)) {
          balances[to] = BigNumber.from(0);
        }
        balances[to] = balances[to].add(amount);
      }
    });
    return balances;
  }
}
