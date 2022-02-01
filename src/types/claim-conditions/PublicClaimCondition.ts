import {
  SnapshotInfoSchema,
  SnapshotSchema,
} from "../../schema/modules/common/snapshots";
import { BigNumber, BytesLike } from "ethers";
import { z } from "zod";
import {
  ClaimConditionInputSchema,
  PartialClaimConditionInputSchema,
} from "../../schema/modules/common/claim-conditions";
// import { CurrencyValue } from "../../common/currency";

// @fixme
type CurrencyValue = unknown;

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

/**
 * @internal
 */
export type SnapshotInfo = z.output<typeof SnapshotInfoSchema>;

/**
 * @internal
 */
export type Snapshot = z.output<typeof SnapshotSchema>;

/**
 * Input model to create a claim condition with optional snapshot of wallets
 */
export type ClaimConditionInput = z.input<
  typeof PartialClaimConditionInputSchema
>;

/**
 * @internal
 */
export type FilledConditionInput = z.output<typeof ClaimConditionInputSchema>;
