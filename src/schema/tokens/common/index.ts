import { z } from "zod";
import { FileBufferOrStringSchema, HexColor, JsonSchema } from "../../shared";
import {
  OptionalPropertiesInput,
  OptionalPropertiesOutput,
} from "./properties";

export const CommonTokenInput = z
  .object({
    name: z.string().nonempty({ message: "A name is required." }),
    description: z.string().optional(),
    image: FileBufferOrStringSchema.optional(),
    external_url: FileBufferOrStringSchema.optional(),
  })
  .catchall(z.lazy(() => JsonSchema));

export const CommonTokenOutput = CommonTokenInput.extend({
  image: z.string().optional(),
  external_url: z.string().optional(),
});

export const CommonNFTInput = CommonTokenInput.extend({
  animation_url: FileBufferOrStringSchema.optional(),
  background_color: HexColor.optional(),
  properties: OptionalPropertiesInput,
});

export const CommonNFTOutput = CommonTokenOutput.extend({
  animation_url: z.string().optional(),
  properties: OptionalPropertiesOutput,
});

export type NFTMetadataInput = z.input<typeof CommonNFTInput>;
export type NFTMetadata = z.output<typeof CommonNFTOutput>;
export type NFTMetadataOwner = { metadata: NFTMetadata; owner: string };
