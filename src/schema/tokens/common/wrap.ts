import { z } from "zod";
import { AddressSchema, PriceSchema } from "../../shared";

/**
 * @internal
 */
const CommonWrappableSchema = z.object({
  contractAddress: AddressSchema,
});

/**
 * @internal
 */
export const ERC20WrappableSchema = CommonWrappableSchema.extend({
  quantity: PriceSchema,
});

/**
 * @internal
 */
export const ERC721WrappableSchema = CommonWrappableSchema.extend({
  tokenId: z.number(),
});

/**
 * @internal
 */
export const ERC1155WrappableSchema = CommonWrappableSchema.extend({
  tokenId: z.number(),
  quantity: z.number(),
});
