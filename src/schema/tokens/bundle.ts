import { z } from "zod";
import { BigNumberSchema } from "../shared";
import { CommonNFTOutput } from "./common";

export const BundleMetadataOutputSchema = z.object({
  supply: BigNumberSchema,
  metadata: CommonNFTOutput,
});

export type BundleDropMetadata = z.output<typeof BundleMetadataOutputSchema>;
