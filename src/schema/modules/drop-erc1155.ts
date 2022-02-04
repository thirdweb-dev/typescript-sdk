import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonSymbolSchema,
  CommonTrustedForwarderSchema,
} from "./common";
import { MerkleSchema } from "./common/snapshots";

export const DropErc1155ModuleInput = CommonModuleSchema.merge(
  CommonRoyaltySchema,
)
  .merge(MerkleSchema)
  .merge(CommonSymbolSchema);

export const DropErc1155ModuleOutput = CommonModuleOutputSchema.merge(
  CommonRoyaltySchema,
)
  .merge(MerkleSchema)
  .merge(CommonSymbolSchema);

export const DropErc1155ModuleDeploy = DropErc1155ModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const DropErc1155ModuleSchema = {
  deploy: DropErc1155ModuleDeploy,
  output: DropErc1155ModuleOutput,
  input: DropErc1155ModuleInput,
};
