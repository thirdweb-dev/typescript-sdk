import { z } from "zod";
import { BigNumberishSchema, BigNumberSchema } from "../shared";
import { CommonNFTInput, CommonNFTOutput } from "./common";

export const EditionMetadataOutputSchema = z.object({
  supply: BigNumberSchema,
  metadata: CommonNFTOutput,
});

export const EditionMetadataInputSchema = z.object({
  supply: BigNumberishSchema,
  metadata: CommonNFTInput,
});

/**
 * @public
 */
export type EditionMetadata = z.output<typeof EditionMetadataOutputSchema>;
/**
 * @internal
 */
export type EditionMetadataInput = z.input<typeof EditionMetadataInputSchema>;
