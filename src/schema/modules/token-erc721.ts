import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonSymbolSchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const TokenErc721ModuleInput =
  CommonModuleSchema.merge(CommonRoyaltySchema).merge(CommonSymbolSchema);

export const TokenErc721ModuleOutput =
  CommonModuleOutputSchema.merge(CommonRoyaltySchema).merge(CommonSymbolSchema);

export const TokenErc721ModuleDeploy = TokenErc721ModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const TokenErc721ModuleSchema = {
  deploy: TokenErc721ModuleDeploy,
  output: TokenErc721ModuleOutput,
  input: TokenErc721ModuleInput,
};
