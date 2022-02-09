import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonPrimarySaleSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const TokenErc1155ModuleInput =
  CommonModuleSchema.merge(CommonRoyaltySchema);

export const TokenErc1155ModuleOutput =
  CommonModuleOutputSchema.merge(CommonRoyaltySchema);

export const TokenErc1155ModuleDeploy = TokenErc1155ModuleInput.merge(
  CommonPlatformFeeSchema,
)
  .merge(CommonPrimarySaleSchema)
  .merge(CommonTrustedForwarderSchema);

export const TokenErc1155ModuleSchema = {
  deploy: TokenErc1155ModuleDeploy,
  output: TokenErc1155ModuleOutput,
  input: TokenErc1155ModuleInput,
};
