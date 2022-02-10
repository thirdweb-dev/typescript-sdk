import {
  CommonContractOutputSchema,
  CommonContractSchema,
  CommonPlatformFeeSchema,
  CommonSymbolSchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const TokenErc20ContractInput =
  CommonContractSchema.merge(CommonSymbolSchema);

export const TokenErc20ContractOutput =
  CommonContractOutputSchema.merge(CommonSymbolSchema);

export const TokenErc20ContractDeploy = TokenErc20ContractInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const TokenErc20ContractSchema = {
  deploy: TokenErc20ContractDeploy,
  output: TokenErc20ContractOutput,
  input: TokenErc20ContractInput,
};
