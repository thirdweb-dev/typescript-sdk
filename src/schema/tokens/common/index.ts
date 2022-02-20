import { z } from "zod";
import {
  BigNumberSchema,
  FileBufferOrStringSchema,
  HexColor,
  JsonSchema,
} from "../../shared";
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
  id: BigNumberSchema,
  uri: z.string(),
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

/**
 * @internal
 */
export type NFTMetadataInput = z.input<typeof CommonNFTInput>;
/**
 * @public
 */
export type NFTMetadata = z.output<typeof CommonNFTOutput>;
/**
 * @public
 */
export type NFTMetadataOwner = { metadata: NFTMetadata; owner: string };
