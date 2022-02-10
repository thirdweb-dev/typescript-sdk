import {
  CommonContractOutputSchema,
  CommonContractSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonSymbolSchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const PacksContractInput =
  CommonContractSchema.merge(CommonRoyaltySchema).merge(CommonSymbolSchema);

export const PacksContractOutput =
  CommonContractOutputSchema.merge(CommonRoyaltySchema).merge(
    CommonSymbolSchema,
  );

export const PacksContractDeploy = PacksContractInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);

export const PacksContractSchema = {
  deploy: PacksContractDeploy,
  output: PacksContractOutput,
  input: PacksContractInput,
};
