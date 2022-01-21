import { BigNumberish } from "ethers";
import { MetadataURIOrObject } from "../../core/types";

/**
 * Represents a new `SignatureMint` request.
 */
export interface NewSignaturePayload {
  /**
   * The metadata of the token to generate a signature for.
   */
  metadata: MetadataURIOrObject;

  /**
   * The receiver of the NFTs being minted when the signature is claimed.
   */
  to: string;

  /**
   * The price per the NFT being minted for this particular signature.
   */
  price: BigNumberish;

  /**
   * The address of the currency used in the event that there is a price set
   * on the token. If this is set to the 0x0 address, then its free to mint.
   */
  currencyAddress: string;
  /**
   * The start time (in epoch seconds or date object) when the signature can be claimed.
   */
  mintStartTime?: BigNumberish | Date;
  /**
   * @deprecated Use mintStartTime instead
   */
  mintStartTimeEpochSeconds?: BigNumberish;
  /**
   * The end time (epoch seconds or date object) that essentially invalidates the signature
   * such that it can no longer be claimed.
   */
  mintEndTime?: BigNumberish | Date;
  /**
   * @deprecated Use mintEndTime instead
   */
  mintEndTimeEpochSeconds?: BigNumberish;

  /**
   * A unique identifier for the signature.
   *
   * If this value is an empty string, then a uuid-v4 will be generated.
   */
  id?: string;
}
