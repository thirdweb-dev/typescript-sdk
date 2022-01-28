import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumber, BigNumberish } from "ethers";
import {
  SignaturePayload,
  NewSignaturePayload,
} from "../schema/modules/common/signature";
import {
  NFTMetadata,
  NFTMetadataInput,
  NFTMetadataOwner,
} from "../schema/tokens/common";

export interface ITokenERC721Module {
  /** ******************************
   * READ FUNCTIONS
   *******************************/

  get(tokenId: string): Promise<NFTMetadata>;
  getAll(): Promise<NFTMetadata[]>;
  getWithOwner(tokenId: string): Promise<NFTMetadataOwner>;
  getAllWithOwner(): Promise<NFTMetadataOwner[]>;
  ownerOf(tokenId: string): Promise<string>;
  getOwned(_address?: string): Promise<NFTMetadata[]>;
  totalSupply(): Promise<BigNumber>;
  balanceOf(address: string): Promise<BigNumber>;
  balance(): Promise<BigNumber>;
  isApproved(address: string, operator: string): Promise<boolean>;
  isTransferRestricted(): Promise<boolean>;

  /** ******************************
   * WRITE FUNCTIONS
   *******************************/

  setApproval(
    operator: string,
    approved?: boolean,
  ): Promise<TransactionReceipt>;
  transfer(to: string, tokenId: string): Promise<TransactionReceipt>;
  mint(metadata: NFTMetadataInput): Promise<NFTMetadata>;
  mintTo(to: string, metadata: NFTMetadataInput): Promise<NFTMetadata>;
  mintBatch(metadatas: NFTMetadataInput[]): Promise<NFTMetadata[]>;
  mintBatchTo(
    to: string,
    metadatas: NFTMetadataInput[],
  ): Promise<NFTMetadata[]>;
  burn(tokenId: BigNumberish): Promise<TransactionReceipt>;
  transferFrom(
    from: string,
    to: string,
    tokenId: BigNumberish,
  ): Promise<TransactionReceipt>;
  setRestrictedTransfer(restricted?: boolean): Promise<TransactionReceipt>;
  mintWithSignature(
    req: SignaturePayload,
    signature: string,
  ): Promise<BigNumber>;

  /** ******************************
   * SIGNATURE FUNCTIONS
   *******************************/

  verify(mintRequest: SignaturePayload, signature: string): Promise<boolean>;
  generateSignatureBatch(payloads: NewSignaturePayload[]): Promise<
    {
      payload: SignaturePayload;
      signature: string;
    }[]
  >;
  generateSignature(mintRequest: NewSignaturePayload): Promise<{
    payload: SignaturePayload;
    signature: string;
  }>;
}
