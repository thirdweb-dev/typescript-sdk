import { z } from "zod";
import { BigNumberSchema } from "../../shared";

export const CurrencySchema = z.object({
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
});

export const CurrencyValueSchema = CurrencySchema.extend({
  value: BigNumberSchema,
  displayValue: z.string(),
});
