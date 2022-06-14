import { z } from "zod";
import { AddressSchema, BigNumberishSchema, PriceSchema } from "../../shared";

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
  tokenId: BigNumberishSchema,
});

/**
 * @internal
 */
export const ERC1155WrappableSchema = CommonWrappableSchema.extend({
  tokenId: BigNumberishSchema,
  quantity: BigNumberishSchema,
});
