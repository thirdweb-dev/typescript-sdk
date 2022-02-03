import { z } from "zod";
import { BigNumberishSchema, BigNumberSchema } from "../shared";
import { CommonNFTInput, CommonNFTOutput } from "./common";

export const BundleMetadataOutputSchema = z.object({
  supply: BigNumberSchema,
  metadata: CommonNFTOutput,
});

export const BundleMetadataInputSchema = z.object({
  supply: BigNumberishSchema,
  metadata: CommonNFTInput,
});

export type BundleMetadata = z.output<typeof BundleMetadataOutputSchema>;
export type BundleMetadataInput = z.input<typeof BundleMetadataInputSchema>;
