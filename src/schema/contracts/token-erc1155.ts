import {
  CommonContractOutputSchema,
  CommonContractSchema,
  CommonPlatformFeeSchema,
  CommonPrimarySaleSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const TokenErc1155ContractInput =
  CommonContractSchema.merge(CommonRoyaltySchema);

export const TokenErc1155ContractOutput =
  CommonContractOutputSchema.merge(CommonRoyaltySchema);

export const TokenErc1155ContractDeploy = TokenErc1155ContractInput.merge(
  CommonPlatformFeeSchema,
)
  .merge(CommonPrimarySaleSchema)
  .merge(CommonTrustedForwarderSchema);

export const TokenErc1155ContractSchema = {
  deploy: TokenErc1155ContractDeploy,
  output: TokenErc1155ContractOutput,
  input: TokenErc1155ContractInput,
};
