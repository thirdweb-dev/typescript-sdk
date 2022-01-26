import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const DropErc721ModuleInput =
  CommonModuleSchema.merge(CommonRoyaltySchema);

export const DropErc721ModuleOutput =
  CommonModuleOutputSchema.merge(CommonRoyaltySchema).passthrough();

export const DropErc721ModuleDeploy = DropErc721ModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);
