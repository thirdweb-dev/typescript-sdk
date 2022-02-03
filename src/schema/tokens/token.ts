import { z } from "zod";
import { BigNumberishSchema } from "../shared";

export const TokenMintInputSchema = z.object({
  toAddress: z.string(),
  amount: BigNumberishSchema,
});

export type TokenMintInput = z.output<typeof TokenMintInputSchema>;
