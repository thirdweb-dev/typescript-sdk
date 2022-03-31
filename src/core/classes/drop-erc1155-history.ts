import { DropERC1155 } from "@thirdweb-dev/contracts";
import { ContractWrapper } from "./contract-wrapper";
import { BigNumber, BigNumberish } from "ethers";

/**
 * Manages history for Edition Drop contracts
 * @public
 */
export class DropErc1155History {
  private contractWrapper;

  constructor(contractWrapper: ContractWrapper<DropERC1155>) {
    this.contractWrapper = contractWrapper;
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
    const a = await this.contractWrapper.readContract.queryFilter(
      this.contractWrapper.readContract.filters.TokensClaimed(
        null,
        BigNumber.from(tokenId),
      ),
    );
    return Array.from(new Set(a.map((b) => b.args.claimer)));
  }
}
