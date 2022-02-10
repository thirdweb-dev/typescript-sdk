import {
  CommonContractOutputSchema,
  CommonContractSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const MarketplaceContractInput =
  CommonContractSchema.merge(CommonRoyaltySchema);

export const MarketplaceContractOutput =
  CommonContractOutputSchema.merge(CommonRoyaltySchema);

export const MarketplaceContractDeploy = MarketplaceContractInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const MarketplaceContractSchema = {
  deploy: MarketplaceContractDeploy,
  output: MarketplaceContractOutput,
  input: MarketplaceContractInput,
};
