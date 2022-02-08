import { NFTMetadata, NFTMetadataInput } from "../schema/tokens/common";
import { BigNumber, BigNumberish } from "ethers";

export interface PackMetadata {
  id: string;
  creator: string;
  currentSupply: BigNumber;
  openStart: Date | null;
  metadata: NFTMetadata;
}

/**
 * @public
 */
export interface PackNFTMetadata {
  supply: BigNumber;
  metadata: NFTMetadata;
}

/**
 * @public
 */
export interface PackMetadataWithBalance extends PackMetadata {
  ownedByAddress: BigNumber;
}

export enum UnderlyingType {
  None = 0,
  ERC20 = 1,
  ERC721 = 2,
}

// TODO zodify
export interface IPackCreateArgs {
  assetContract: string;
  metadata: NFTMetadataInput;
  assets: {
    tokenId: BigNumberish;
    amount: BigNumberish;
  }[];
  secondsUntilOpenStart?: BigNumberish;
  rewardsPerOpen?: BigNumberish;
}

/**
 * @beta
 */
// TODO zodify
export interface IPackBatchArgs {
  tokenId: BigNumberish;
  amount: BigNumberish;
}
