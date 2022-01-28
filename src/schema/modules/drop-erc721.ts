import {
  DropErc721TokenInput,
  DropErc721TokenOutput,
} from "../tokens/drop-erc721";
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
  tokenInput: DropErc721TokenInput,
  tokenOutput: DropErc721TokenOutput,
};
