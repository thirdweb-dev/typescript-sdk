import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonSymbolSchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const TokenErc20ModuleInput =
  CommonModuleSchema.merge(CommonSymbolSchema);

export const TokenErc20ModuleOutput =
  CommonModuleOutputSchema.merge(CommonSymbolSchema);

export const TokenErc20ModuleDeploy = TokenErc20ModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const TokenErc20ModuleSchema = {
  deploy: TokenErc20ModuleDeploy,
  output: TokenErc20ModuleOutput,
  input: TokenErc20ModuleInput,
};
