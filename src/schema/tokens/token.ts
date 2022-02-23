import { z } from "zod";
import { BigNumberishSchema } from "../shared";

/**
 * @internal
 */
export const TokenMintInputSchema = z.object({
  toAddress: z.string(),
  amount: BigNumberishSchema,
});

/**
 * @public
 */
export type TokenMintInput = z.input<typeof TokenMintInputSchema>;
