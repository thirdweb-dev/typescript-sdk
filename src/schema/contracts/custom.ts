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
import { BigNumberish } from "ethers";
import { toSemver } from "../../common/index";

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
export const PreDeployMetadata = z
  .object({
    name: z.string(),
    metadataUri: z.string(),
    bytecodeUri: z.string(),
  })
  .catchall(z.any());

/**
 * @internal
 */
export const ExtraPublishMetadataSchema = z
  .object({
    version: z.string().refine(
      (v) => {
        toSemver(v);
      },
      (out) => {
        return {
          message: `${out} is not a valid semantic version. Should be in the format of major.minor.patch. Ex: 0.4.1`,
        };
      },
    ),
    displayName: z.string().optional(),
    description: z.string().optional(),
    readme: z.string().optional(),
    license: z.string().optional(),
    changelog: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .catchall(z.any());
export type ExtraPublishMetadata = z.infer<typeof ExtraPublishMetadataSchema>;

/**
 * @internal
 */
export const FullPublishMetadataSchema = PreDeployMetadata.merge(
  ExtraPublishMetadataSchema,
);
export type FullPublishMetadata = z.infer<typeof FullPublishMetadataSchema>;

/**
 * @internal
 */
export const ProfileSchema = z.object({
  name: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  website: z.string().optional(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  facebook: z.string().optional(),
  github: z.string().optional(),
  medium: z.string().optional(),
  linkedin: z.string().optional(),
  reddit: z.string().optional(),
  discord: z.string().optional(),
});
export type ProfileMetadata = z.infer<typeof ProfileSchema>;

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

/**
 * @internal
 * Follows https://docs.soliditylang.org/en/v0.8.15/natspec-format.html
 */
export const ContractInfoSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  details: z.string().optional(),
  notice: z.string().optional(),
});

export const CompilerMetadataFetchedSchema = z.object({
  name: z.string(),
  abi: AbiSchema,
  metadata: z.record(z.string(), z.any()),
  info: ContractInfoSchema,
  licenses: z.array(z.string()),
});

export const PreDeployMetadataFetchedSchema = PreDeployMetadata.merge(
  CompilerMetadataFetchedSchema,
).extend({
  bytecode: z.string(),
});

export type PreDeployMetadataFetched = z.infer<
  typeof PreDeployMetadataFetchedSchema
>;

export type ContractParam = z.infer<typeof AbiTypeSchema>;
export type PublishedContract = z.infer<typeof PublishedContractSchema>;
export type PublishedContractFetched = {
  name: string;
  publishedTimestamp: BigNumberish;
  publishedMetadata: FullPublishMetadata;
};
export type AbiFunction = {
  name: string;
  inputs: z.infer<typeof AbiTypeSchema>[];
  outputs: z.infer<typeof AbiTypeSchema>[];
  signature: string;
  stateMutability: string;
  comment: string;
};
export type ContractSource = {
  filename: string;
  source: string;
};
export type PublishedMetadata = z.infer<typeof CompilerMetadataFetchedSchema>;
