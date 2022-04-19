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

export const BYOCContractMetadataSchema = CommonContractSchema.catchall(
  z.lazy(() => JsonSchema),
);

export type CustomContractMetadata = z.input<typeof BYOCContractMetadataSchema>;

export const CustomContractInput = BYOCContractMetadataSchema.merge(
  CommonRoyaltySchema.merge(MerkleSchema).merge(CommonSymbolSchema).partial(),
);

export const CustomContractOutput = CommonContractOutputSchema.merge(
  CommonRoyaltySchema.merge(MerkleSchema).merge(CommonSymbolSchema).partial(),
);

export const CustomContractDeploy = CustomContractInput.merge(
  CommonPlatformFeeSchema.merge(CommonPrimarySaleSchema)
    .merge(CommonTrustedForwarderSchema)
    .partial(),
);

export const CustomContractSchema = {
  deploy: CustomContractDeploy,
  output: CustomContractOutput,
  input: CustomContractInput,
};

export const CustomContractMetadataSchema = z.object({
  name: z.string(),
  abiUri: z.string(),
  bytecodeUri: z.string(),
});

export const AbiTypeSchema = z
  .object({
    type: z.string(),
    name: z.string(),
  })
  .catchall(z.lazy(() => JsonSchema));

export const AbiObjectSchema = z
  .object({
    type: z.string(),
    name: z.string().default(""),
    inputs: z.array(AbiTypeSchema).default([]),
    outputs: z.array(AbiTypeSchema).default([]),
  })
  .catchall(z.lazy(() => JsonSchema));

export const AbiSchema = z.array(AbiObjectSchema);

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
};
export type PublishedMetadata = {
  name: string;
  abi: z.infer<typeof AbiSchema>;
  bytecode: string;
};
