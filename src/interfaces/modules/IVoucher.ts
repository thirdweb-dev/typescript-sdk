import { BigNumber, BigNumberish } from "ethers";
import { NFTMetadata } from "../../common/nft";
import { NewMintRequest, Voucher } from "../../types/voucher";

export interface IVoucher {
  /**
   * Creates a new voucher based on the metadata provided.
   *
   * @param tokenMetadata - The metadata of the token to generate a signature for.
   * @returns - The ID of the minted token.
   */
  mint(req: Voucher, signature: string): Promise<BigNumber>;

  /**
   * Creates many vouchers at once based on the metadata provided.
   *
   * @param tokenMetadata - The metadata of the tokens to generate signatures for.
   * @returns - The signatures of the vouchers.
   */
  mintBatch(tokenMetadata: NewMintRequest[]): Promise<string[]>;

  /**
   * Verifies the signature of a voucher.
   *
   * @param mintRequest - The signature of the voucher to verify.
   * @returns - True if the signature is valid, false otherwise.
   */
  verify(mintRequest: Voucher, signature: string): Promise<boolean>;

  /**
   * Claims a given voucher.
   *
   * @param mintRequest - The voucher to claim.
   * @param signature - The signature of the voucher to claim.
   */
  claim(mintRequest: Voucher, signature: string): Promise<void>;

  /**
   * Generates a signature for a given voucher. This should only be called
   * by wallets that have the `MINTER` role on the contract. Otherwise
   * their signature won't be valid.
   *
   * @param mintRequest - The voucher to generate a signature for.
   * @returns - The voucher (with the uri pre-populated) and signature of the voucher.
   */
  generateSignature(
    mintRequest: NewMintRequest,
  ): Promise<{ voucher: Voucher; signature: string }>;

  /**
   * Get the nft with the given id.
   *
   * @param tokenId - The id to fetch.
   */
  get(tokenId: BigNumberish): Promise<NFTMetadata>;
}
