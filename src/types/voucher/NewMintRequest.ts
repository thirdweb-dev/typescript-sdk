import { NFTMetadata } from "../../common/nft";
import { Voucher } from "./Voucher";

/**
 * Represents the common fields of a voucher.
 */
export interface NewMintRequest extends Voucher {
  /**
   * The metadata of the token to generate a signature for.
   */
  metadata: NFTMetadata;
}
