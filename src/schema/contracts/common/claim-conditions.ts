import { z } from "zod";
import { BigNumber, ethers } from "ethers";
import {
  BigNumberishSchema,
  BigNumberSchema,
  BytesLikeSchema,
  PriceSchema,
} from "../../shared";
import { hexZeroPad } from "ethers/lib/utils";
import { NATIVE_TOKEN_ADDRESS } from "../../../constants/currency";
import { CurrencyValueSchema } from "./currency";

export const ClaimConditionInputSchema = z.object({
  startTime: z
    .union([z.date(), z.number()])
    .transform((i) => {
      if (typeof i === "number") {
        return Math.floor(i);
      } else {
        return Math.floor(i.getTime() / 1000);
      }
    })
    .default(Math.floor(Date.now() / 1000)),
  currencyAddress: z.string().default(NATIVE_TOKEN_ADDRESS),
  price: PriceSchema.default(0),
  maxQuantity: BigNumberishSchema.default(ethers.constants.MaxUint256),
  quantityLimitPerTransaction: BigNumberishSchema.default(
    ethers.constants.MaxUint256,
  ),
  waitInSeconds: BigNumberishSchema.default(0),
  merkleRootHash: BytesLikeSchema.default(hexZeroPad([0], 32)),
  snapshot: z.optional(z.array(z.string())),
});

export const PartialClaimConditionInputSchema =
  ClaimConditionInputSchema.partial();

export const ClaimConditionOutputSchema = ClaimConditionInputSchema.omit({
  snapshot: true,
}).extend({
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
});
