import { BigNumber, BigNumberish } from "ethers";
import { NFTMetadata } from "../../common/nft";
import { NewSignatureMint, SignatureMint } from "../../types/signature-minting";

export interface ISignatureMinter {
  /**
   * Mints an NFT given a voucher and signature.
   *
   * @param tokenMetadata - The metadata of the token to generate a signature for.
   * @returns - The ID of the minted token.
   */
  mintWithSignature(req: SignatureMint, signature: string): Promise<BigNumber>;

  /**
   * Verifies the signature of a voucher.
   *
   * @param mintRequest - The signature of the voucher to verify.
   * @returns - True if the signature is valid, false otherwise.
   */
  verify(mintRequest: SignatureMint, signature: string): Promise<boolean>;

  /**
   * Generates a signature for a given voucher. This should only be called
   * by wallets that have the `MINTER` role on the contract. Otherwise
   * their signature won't be valid.
   *
   * @param mintRequest - The voucher to generate a signature for.
   * @returns - The voucher (with the uri pre-populated) and signature of the voucher.
   */
  generateSignature(
    mintRequest: NewSignatureMint,
  ): Promise<{ voucher: SignatureMint; signature: string }>;

  /**
   * Batch generation of signatures.
   *
   * @param mintRequest - The voucher to generate a signature for.
   * @returns - The batch of voucher signatures.
   */
  generateSignatureBatch(
    mintRequests: NewSignatureMint[],
  ): Promise<{ voucher: SignatureMint; signature: string }[]>;
}
