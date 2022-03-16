import { z } from "zod";
import { AddressSchema, PriceSchema } from "../shared";

/**
 * @internal
 */
export const TokenMintInputSchema = z.object({
  toAddress: AddressSchema,
  amount: PriceSchema,
});

/**
 * @public
 */
export type TokenMintInput = z.input<typeof TokenMintInputSchema>;
