import { NewMintRequest } from "./NewMintRequest";

/**
 * Represents the common fields any Voucher will have.
 */
export interface Voucher extends NewMintRequest {
  /**
   * The URI of the token metadata corresponding to this voucher.
   */
  uri: string;
}
