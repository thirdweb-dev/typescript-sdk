import { NewSignatureMint } from "./NewMintRequest";

/**
 * Represents a prepared `SignatureMint` object.
 */
export interface SignatureMint extends NewSignatureMint {
  /**
   * The URI of the token metadata corresponding to this voucher.
   */
  uri: string;
}
