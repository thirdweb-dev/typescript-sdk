import { DropERC1155 } from "contracts";
import { ContractWrapper } from "./contract-wrapper";
import { BigNumber, BigNumberish } from "ethers";
import { ContractAnalytics } from "./contract-analytics";

/**
 * Manages history for Edition Drop contracts
 * @public
 */
export class DropErc1155History {
  private analytics;

  constructor(analytics: ContractAnalytics<DropERC1155>) {
    this.analytics = analytics;
  }

  /**
   * Get all claimer addresses
   *
   * @remarks Get a list of all the addresses that have claimed a token
   * @param tokenId - the tokenId of the NFT to get the addresses of*
   * @returns - A unique list of addresses that claimed the token
   * @example
   * ```javascript
   * const tokenId = "0";
   * const allClaimerAddresses = await contract.history.getAllClaimerAddresses(tokenId);
   * ```
   */
  public async getAllClaimerAddresses(
    tokenId: BigNumberish,
  ): Promise<string[]> {
    const a = (await this.analytics.query("TokensClaimed")).filter((e) =>
      e.args?.tokenId.eq(tokenId),
    );

    return Array.from(new Set(a.map((b) => b.args?.claimer)));
  }
}
