import {
  SnapshotInfoSchema,
  SnapshotInputSchema,
  SnapshotSchema,
} from "../../schema/contracts/common/snapshots";
import { z } from "zod";
import {
  ClaimConditionInputSchema,
  ClaimConditionOutputSchema,
  PartialClaimConditionInputSchema,
} from "../../schema/contracts/common/claim-conditions";
import { BigNumber, BytesLike, CallOverrides } from "ethers";

/**
 * Represents a claim condition fetched from the SDK
 */
export type ClaimCondition = z.output<typeof ClaimConditionOutputSchema>;

/**
 * @internal
 */
export type SnapshotInfo = z.output<typeof SnapshotInfoSchema>;

/**
 * @internal
 */
export type Snapshot = z.output<typeof SnapshotSchema>;

/**
 * Input model to pass a snapshot of addresses + amount claimable for a claim condition
 */
export type SnapshotInput = z.output<typeof SnapshotInputSchema>;

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

export type ClaimVerification = {
  overrides: CallOverrides;
  proofs: BytesLike[];
  maxQuantityPerTransaction: BigNumber;
  price: BigNumber;
  currencyAddress: string;
};
