import { z } from "zod";
import { BigNumberishSchema, BigNumberSchema } from "../shared";
import { CommonNFTInput, CommonNFTOutput } from "./common";

/**
 * @internal
 */
export const EditionMetadataOutputSchema = z.object({
  supply: BigNumberSchema,
  metadata: CommonNFTOutput,
});

/**
 * @internal
 */
export const EditionMetadataWithOwnerOutputSchema =
  EditionMetadataOutputSchema.extend({
    owner: z.string(),
    quantityOwned: BigNumberSchema,
  });

/**
 * @internal
 */
export const EditionMetadataInputSchema = z.object({
  supply: BigNumberishSchema,
  metadata: CommonNFTInput,
});

/**
 * @public
 */
export type EditionMetadata = z.output<typeof EditionMetadataOutputSchema>;
/**
 * @public
 */
export type EditionMetadataOwner = z.output<
  typeof EditionMetadataWithOwnerOutputSchema
>;
/**
 * @public
 */
export type EditionMetadataInput = z.input<typeof EditionMetadataInputSchema>;
