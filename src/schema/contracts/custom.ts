import {
  CommonContractOutputSchema,
  CommonContractSchema,
  CommonPlatformFeeSchema,
  CommonPrimarySaleSchema,
  CommonRoyaltySchema,
  CommonSymbolSchema,
  CommonTrustedForwarderSchema,
  MerkleSchema,
} from "./common";
import { z } from "zod";
import { BigNumberishSchema, JsonSchema } from "../shared";

/**
 * @internal
 */
export const BYOCContractMetadataSchema = CommonContractSchema.catchall(
  z.lazy(() => JsonSchema),
);

export type CustomContractMetadata = z.input<typeof BYOCContractMetadataSchema>;

/**
 * @internal
 */
export const CustomContractInput = BYOCContractMetadataSchema.merge(
  CommonRoyaltySchema.merge(MerkleSchema).merge(CommonSymbolSchema).partial(),
);

/**
 * @internal
 */
export const CustomContractOutput = CommonContractOutputSchema.merge(
  CommonRoyaltySchema.merge(MerkleSchema).merge(CommonSymbolSchema).partial(),
);

/**
 * @internal
 */
export const CustomContractDeploy = CustomContractInput.merge(
  CommonPlatformFeeSchema.merge(CommonPrimarySaleSchema)
    .merge(CommonTrustedForwarderSchema)
    .partial(),
);

/**
 * @internal
 */
export const CustomContractSchema = {
  deploy: CustomContractDeploy,
  output: CustomContractOutput,
  input: CustomContractInput,
};

/**
 * @internal
 */
export const PreDeployMetadata = z.object({
  name: z.string(),
  metadataUri: z.string(),
  bytecodeUri: z.string(),
});
export type PreDeployMetadataFetched = {
  name: string;
  abi: z.infer<typeof AbiSchema>;
  bytecode: string;
};

/**
 * @internal
 */
const AbiTypeBaseSchema = z
  .object({
    type: z.string(),
    name: z.string(),
  })
  .catchall(z.any());

/**
 * @internal
 */
export const AbiTypeSchema = AbiTypeBaseSchema.extend({
  stateMutability: z.string().optional(),
  components: z.array(AbiTypeBaseSchema).optional(),
}).catchall(z.any());

/**
 * @internal
 */
export const AbiObjectSchema = z
  .object({
    type: z.string(),
    name: z.string().default(""),
    inputs: z.array(AbiTypeSchema).default([]),
    outputs: z.array(AbiTypeSchema).default([]),
  })
  .catchall(z.any());

/**
 * @internal
 */
export const AbiSchema = z.array(AbiObjectSchema);

/**
 * @internal
 */
export const PublishedContractSchema = z.object({
  id: z.string(),
  timestamp: BigNumberishSchema,
  metadataUri: z.string(),
});

export type ContractParam = z.infer<typeof AbiTypeSchema>;
export type PublishedContract = z.infer<typeof PublishedContractSchema>;
export type AbiFunction = {
  name: string;
  inputs: z.infer<typeof AbiTypeSchema>[];
  outputs: z.infer<typeof AbiTypeSchema>[];
  signature: string;
  stateMutability: string;
};
export type ContractSource = {
  filename: string;
  source: string;
};
export type PublishedMetadata = {
  name: string;
  abi: z.infer<typeof AbiSchema>;
  sources: ContractSource[];
};
