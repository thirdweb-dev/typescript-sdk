import { NewSignaturePayload } from "./NewSignaturePayload";

/**
 * Represents a prepared `SignaturePayload` object, which will be signed
 * by a wallet.
 */
export interface SignaturePayload extends NewSignaturePayload {
  /**
   * The URI of the token metadata corresponding to this signature
   */
  uri: string;
}
