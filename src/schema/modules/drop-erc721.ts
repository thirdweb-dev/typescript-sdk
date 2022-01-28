import { CommonNFTInput, CommonNFTOutput } from "../tokens/common/index";
import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";
import { MerkleSchema } from "./common/snapshots";

export const DropErc721ModuleInput =
  CommonModuleSchema.merge(CommonRoyaltySchema).merge(MerkleSchema);

export const DropErc721ModuleOutput =
  CommonModuleOutputSchema.merge(CommonRoyaltySchema).merge(MerkleSchema);

export const DropErc721ModuleDeploy = DropErc721ModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const DropErc721ModuleSchema = {
  deploy: DropErc721ModuleDeploy,
  output: DropErc721ModuleOutput,
  input: DropErc721ModuleInput,
  tokenInput: CommonNFTInput,
  tokenOutput: CommonNFTOutput,
};
