import { BigNumberish } from "ethers";
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

export interface NewErc1155SignaturePayload extends NewSignaturePayload {
  tokenId: BigNumberish;
  quantity: BigNumberish;
}

export interface Erc1155SignaturePayload extends NewErc1155SignaturePayload {
  uri: string;
}
