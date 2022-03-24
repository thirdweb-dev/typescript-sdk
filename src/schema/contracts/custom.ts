import { CommonContractOutputSchema, CommonContractSchema } from "./common";

export const CustomContractInput = CommonContractSchema;

export const CustomContractOutput = CommonContractOutputSchema;

export const CustomContractDeploy = CustomContractInput;

export const CustomContractSchema = {
  deploy: CustomContractDeploy,
  output: CustomContractOutput,
  input: CustomContractInput,
};
