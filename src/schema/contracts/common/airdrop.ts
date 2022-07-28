import { z } from "zod";
import { AddressSchema, AirdropQuantitySchema } from "../../shared";

/**
 * @internal
 */
export const AirdropAddressInput = z.object({
  address: AddressSchema,
  quantity: AirdropQuantitySchema.default(1),
});

/**
 * @internal
 */
export const AirdropInputSchema = z.union([
  z.array(z.string()).transform((strings) =>
    strings.map((address) =>
      AirdropAddressInput.parse({
        address,
      }),
    ),
  ),
  z.array(AirdropAddressInput),
]);
