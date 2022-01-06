import { BigNumber } from "ethers";
import {
  NewSignaturePayload,
  SignaturePayload,
} from "../../types/signature-minting";

export interface ISignatureMinter {
  /**
   * Mints an NFT given a payload and signature.
   *
   * @param tokenMetadata - The metadata of the token to generate a signature for.
   * @returns - The ID of the minted token.
   */
  mintWithSignature(
    req: SignaturePayload,
    signature: string,
  ): Promise<BigNumber>;

  /**
   * Verifies the signature.
   *
   * @param mintRequest - The signature of the pyaload to verify.
   * @returns - True if the signature is valid, false otherwise.
   */
  verify(mintRequest: SignaturePayload, signature: string): Promise<boolean>;

  /**
   * Generates a signature. This should only be called
   * by wallets that have the `MINTER` role on the contract. Otherwise
   * their signature won't be valid.
   *
   * @param mintRequest - The request to generate a signature for.
   * @returns - The payload (with the uri pre-populated) and signature.
   */
  generateSignature(
    mintRequest: NewSignaturePayload,
  ): Promise<{ payload: SignaturePayload; signature: string }>;

  /**
   * Batch generation of signatures.
   *
   * @param paylaods - The payloads to generate a signatures for.
   * @returns - The batch of payloads + signatures.
   */
  generateSignatureBatch(
    payloads: NewSignaturePayload[],
  ): Promise<{ payload: SignaturePayload; signature: string }[]>;
}
