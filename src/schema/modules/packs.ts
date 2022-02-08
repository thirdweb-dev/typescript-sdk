import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const PacksModuleInput = CommonModuleSchema.merge(CommonRoyaltySchema);

export const PacksModuleOutput =
  CommonModuleOutputSchema.merge(CommonRoyaltySchema);

export const PacksModuleDeploy = PacksModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const PacksModuleSchema = {
  deploy: PacksModuleDeploy,
  output: PacksModuleOutput,
  input: PacksModuleInput,
};
