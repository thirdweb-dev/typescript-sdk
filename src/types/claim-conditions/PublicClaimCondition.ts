import { BigNumber, BigNumberish, BytesLike } from "ethers";
import { z } from "zod";
import { SnapshotInfoSchema } from "../../schema/modules/common/snapshots";
// import { CurrencyValue } from "../../common/currency";

// @fixme
type CurrencyValue = unknown;

/**
 * @public
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
 */
export interface ClaimCondition {
  startTimestamp: Date;
  maxMintSupply: string;
  currentMintSupply: string;
  availableSupply: string;
  quantityLimitPerTransaction: string;
  waitTimeSecondsLimitPerTransaction: string;
  price: BigNumber;
  pricePerToken: BigNumber;
  currency: string;
  currencyContract: string;
  currencyMetadata: CurrencyValue | null;
  merkleRoot: BytesLike;
}

export type SnapshotInfo = z.output<typeof SnapshotInfoSchema>;
