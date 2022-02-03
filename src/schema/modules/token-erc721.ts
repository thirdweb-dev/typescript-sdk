import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const TokenErc721ModuleInput =
  CommonModuleSchema.merge(CommonRoyaltySchema);

export const TokenErc721ModuleOutput =
  CommonModuleOutputSchema.merge(CommonRoyaltySchema);

export const TokenErc721ModuleDeploy = TokenErc721ModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const TokenErc721ModuleSchema = {
  deploy: TokenErc721ModuleDeploy,
  output: TokenErc721ModuleOutput,
  input: TokenErc721ModuleInput,
};
