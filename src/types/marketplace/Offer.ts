import { BigNumber, BigNumberish } from "ethers";

export interface Offer {
  /**
   * The id of the listing.
   */
  listingId: BigNumberish;

  /**
   * The quantity of tokens to be bought.
   */
  quantityDesired: BigNumberish;

  /**
   * The amount of tokens offered.
   */
  tokens: BigNumber;

  /**
   * The currency contract address of the offer token.
   */
  currencyContractAddress: string;
}
