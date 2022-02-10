import {
  CommonContractOutputSchema,
  CommonContractSchema,
  CommonPlatformFeeSchema,
  CommonTrustedForwarderSchema,
} from "./common";
import { z } from "zod";
import { BigNumberishSchema, BigNumberSchema } from "../shared";

const SplitRecipientInputSchema = z.object({
  address: z.string(),
  shares: BigNumberishSchema,
});

const SplitRecipientOuputSchema = SplitRecipientInputSchema.extend({
  address: z.string(),
  shares: BigNumberSchema,
});

export const SplitsContractInput = CommonContractSchema.extend({
  recipientSplits: z.array(SplitRecipientInputSchema).default([]),
});

export const SplitsContractOutput = CommonContractOutputSchema.extend({
  recipientSplits: z.array(SplitRecipientOuputSchema),
});

export const SplitsContractDeploy = SplitsContractInput.merge(
  CommonPlatformFeeSchema,
)
  .merge(SplitsContractInput)
  .merge(CommonTrustedForwarderSchema);

export const SplitsContractSchema = {
  deploy: SplitsContractDeploy,
  output: SplitsContractOutput,
  input: SplitsContractInput,
};
