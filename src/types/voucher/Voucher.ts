import { BigNumberish } from "ethers";

/**
 * Represents the common fields any Voucher will have.
 */
export interface Voucher {
  /**
   * The receiver of the NFTs being minted when the voucher is claimed.
   */
  to: string;

  /**
   * The quantity of NFTs being minted for this particular voucher.
   */
  quantity: BigNumberish;

  /**
   * The price per token of the NFTs being minted for this particular voucher.
   */
  pricePerToken: BigNumberish;

  /**
   * The address of the currency used in the event that there is a price set
   * on the token. If this is set to the 0x0 address, then its free to mint.
   */
  currencyAddress: string;

  /**
   * The epoch start time (in seconds) when the voucher can be claimed.
   */
  voucherStartTimeEpochSeconds: BigNumberish;

  /**
   * The epoch end time (in seconds) that essentially invalidates the voucher
   * such that it can no longer be claimed.
   */
  voucherEndTimeEpochSeconds: BigNumberish;

  /**
   * A unique identifier for the voucher.
   */
  id: string;
}
