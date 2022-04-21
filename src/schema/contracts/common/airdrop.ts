import { z } from "zod";
import { AddressSchema, PriceSchema } from "../../shared";

/**
 * @internal
 */
export const AirdropAddressInput = z.object({
  address: AddressSchema,
  quantity: PriceSchema.default(1),
});

/**
 * @internal
 */
/* export const AirdropInputSchema = z.union([
  z.array(z.string()).transform((strings) =>
    strings.map((address) =>
      AirdropAddressInput.parse({
        address,
      }),
    ),
  ),
  z.array(AirdropAddressInput),
]); */
