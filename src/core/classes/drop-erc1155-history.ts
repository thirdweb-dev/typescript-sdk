import { DropERC1155 } from "@thirdweb-dev/contracts";
import { ContractWrapper } from "./contract-wrapper";
import { BigNumberish } from "ethers";

/**
 * Manages claim conditions for Edition Drop contracts
 * @public
 */
export class DropErc1155History {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<DropERC1155>) {
    this.contractWrapper = contractWrapper;
  }

  /** ***************************************
   * READ FUNCTIONS
   *****************************************/

  /**
   * Pulls the list of all addresses that have claimed a particular token
   *
   * @beta - This can be very slow for large numbers of token holders
   *
   * @param tokenId - The token id to get the claimers of
   * @returns - A unique list of addresses that claimed the token
   */
  public async getAllClaimerAddresses(
    tokenId: BigNumberish,
  ): Promise<string[]> {
    const a = await this.contractWrapper.readContract.queryFilter(
      this.contractWrapper.readContract.filters.TokensClaimed(null, tokenId),
    );
    return Array.from(new Set(a.map((b) => b.args.claimer)));
  }
}
