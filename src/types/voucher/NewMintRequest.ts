import { BigNumberish } from "ethers";
import { MetadataURIOrObject } from "../../core/types";

/**
 * Represents the common fields of a voucher.
 */
export interface NewMintRequest {
  /**
   * The metadata of the token to generate a signature for.
   */
  metadata: MetadataURIOrObject;

  /**
   * The receiver of the NFTs being minted when the voucher is claimed.
   */
  to: string;

  /**
   * The price per the NFT being minted for this particular voucher.
   */
  price: BigNumberish;

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
   *
   * If this value is an empty string, then a uuid-v4 will be generated.
   */
  id?: string;
}
