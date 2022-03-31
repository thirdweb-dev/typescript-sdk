import { z } from "zod";
import { BigNumber } from "ethers";
import {
  BigNumberishSchema,
  BigNumberSchema,
  BytesLikeSchema,
  PriceSchema,
  StartDateSchema,
} from "../../shared";
import { hexZeroPad } from "ethers/lib/utils";
import { NATIVE_TOKEN_ADDRESS } from "../../../constants/currency";
import { CurrencyValueSchema } from "./currency";
import { SnapshotInputSchema } from "./snapshots";

/**
 * @internal
 */
export const ClaimConditionInputSchema = z.object({
  startTime: StartDateSchema,
  currencyAddress: z.string().default(NATIVE_TOKEN_ADDRESS),
  price: PriceSchema.default(0),
  maxQuantity: z
    .union([PriceSchema, z.literal("unlimited")])
    .default("unlimited"),
  quantityLimitPerTransaction: z
    .union([PriceSchema, z.literal("unlimited")])
    .default("unlimited"),
  waitInSeconds: BigNumberishSchema.default(0),
  merkleRootHash: BytesLikeSchema.default(hexZeroPad([0], 32)),
  snapshot: z.optional(SnapshotInputSchema),
});

/**
 * @internal
 */
export const ClaimConditionInputArray = z.array(ClaimConditionInputSchema);

/**
 * @internal
 */
export const PartialClaimConditionInputSchema =
  ClaimConditionInputSchema.partial();

/**
 * @internal
 */
export const ClaimConditionOutputSchema = ClaimConditionInputSchema.extend({
  availableSupply: z.string().default(""),
  currencyMetadata: CurrencyValueSchema.default({
    value: BigNumber.from("0"),
    displayValue: "0",
    symbol: "",
    decimals: 18,
    name: "",
  }),
  price: BigNumberSchema,
  maxQuantity: BigNumberSchema,
  quantityLimitPerTransaction: BigNumberSchema,
  waitInSeconds: BigNumberSchema,
  startTime: BigNumberSchema.transform((n) => new Date(n.toNumber() * 1000)),
});
