import { z } from "zod";
import { BigNumberSchema } from "../../shared";

export const CurrencyValueSchema = z.object({
  value: BigNumberSchema,
  displayValue: z.string(),
});
