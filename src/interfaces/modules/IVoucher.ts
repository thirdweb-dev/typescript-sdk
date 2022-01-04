import { BigNumber, BigNumberish } from "ethers";
import { NFTMetadata } from "../../common/nft";
import { NewMintRequest, Voucher } from "../../types/voucher";

export interface IVoucher {
  /**
   * Mints an NFT given a voucher and signature.
   *
   * @param tokenMetadata - The metadata of the token to generate a signature for.
   * @returns - The ID of the minted token.
   */
  mint(req: Voucher, signature: string): Promise<BigNumber>;

  // TODO: proper multicall first
  // /**
  //  * Creates many vouchers at once based on the metadata provided.
  //  *
  //  * @param tokenMetadata - The metadata of the tokens to generate signatures for.
  //  * @returns - The signatures of the vouchers.
  //  */
  // mintBatch(tokenMetadata: NewMintRequest[]): Promise<string[]>;

  /**
   * Verifies the signature of a voucher.
   *
   * @param mintRequest - The signature of the voucher to verify.
   * @returns - True if the signature is valid, false otherwise.
   */
  verify(mintRequest: Voucher, signature: string): Promise<boolean>;

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
   * Batch generation of signatures.
   *
   * @param mintRequest - The voucher to generate a signature for.
   * @returns - The batch of voucher signatures.
   */
  generateSignatureBatch(
    mintRequests: NewMintRequest[],
  ): Promise<{ voucher: Voucher; signature: string }[]>;

  /**
   * Get the nft with the given id.
   *
   * @param tokenId - The id to fetch.
   */
  get(tokenId: BigNumberish): Promise<NFTMetadata>;

  /**
   * Get all nfts owned by the current address
   *
   * @param _address -  The address to fetch owned NFTs for.
   */
  getOwned(_address?: string): Promise<NFTMetadata[]>;

  /**
   * Return the total count of NFTs created by this contract
   */
  totalSupply(): Promise<BigNumber>;

  /**
   * Check the balance of a specific address
   *
   * @param address - Address to check balance of
   */
  balanceOf(address: string): Promise<BigNumber>;

  /**
   * Checks the balance of the current address
   */
  balance(): Promise<BigNumber>;
}
