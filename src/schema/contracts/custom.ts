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

export const CustomContractInput = CommonContractSchema.merge(
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

export const AbiInputSchema = z.object({
  type: z.string(),
  name: z.string(),
});

export const AbiObjectSchema = z.object({
  type: z.string(),
  inputs: z.array(AbiInputSchema),
});

export const AbiSchema = z.array(AbiObjectSchema);
