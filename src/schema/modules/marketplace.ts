import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const MarketplaceModuleInput =
  CommonModuleSchema.merge(CommonRoyaltySchema);

export const MarketplaceModuleOutput =
  CommonModuleOutputSchema.merge(CommonRoyaltySchema);

export const MarketplaceModuleDeploy = MarketplaceModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const MarketplaceModuleSchema = {
  deploy: MarketplaceModuleDeploy,
  output: MarketplaceModuleOutput,
  input: MarketplaceModuleInput,
};
