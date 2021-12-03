import { BigNumber, BigNumberish, BytesLike } from "ethers";

/**
 * @beta
 */
export interface PublicClaimCondition {
  startTimestamp: BigNumber;
  maxMintSupply: BigNumberish;
  currentMintSupply: BigNumberish;
  quantityLimitPerTransaction: BigNumberish;
  waitTimeSecondsLimitPerTransaction: BigNumberish;
  pricePerToken: BigNumberish;
  currency: string;
  merkleRoot: BytesLike;
}

/**
 * @beta
 * @deprecated
 */
export interface PublicMintCondition extends PublicClaimCondition {}
