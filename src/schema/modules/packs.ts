import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonSymbolSchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const PacksModuleInput =
  CommonModuleSchema.merge(CommonRoyaltySchema).merge(CommonSymbolSchema);

export const PacksModuleOutput =
  CommonModuleOutputSchema.merge(CommonRoyaltySchema).merge(CommonSymbolSchema);

export const PacksModuleDeploy = PacksModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const PacksModuleSchema = {
  deploy: PacksModuleDeploy,
  output: PacksModuleOutput,
  input: PacksModuleInput,
};
