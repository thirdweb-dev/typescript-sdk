import {
  CommonContractOutputSchema,
  CommonContractSchema,
  CommonPlatformFeeSchema,
  CommonTrustedForwarderSchema,
} from "./common";
import { z } from "zod";
import { AddressSchema, BasisPointsSchema } from "../shared";

const SplitRecipientInputSchema = z.object({
  address: AddressSchema,
  sharesBps: BasisPointsSchema,
});

const SplitRecipientOuputSchema = SplitRecipientInputSchema.extend({
  address: AddressSchema,
  sharesBps: BasisPointsSchema,
});

export const SplitsContractInput = CommonContractSchema.extend({
  recipients: z.array(SplitRecipientInputSchema).default([]),
});

export const SplitsContractOutput = CommonContractOutputSchema.extend({
  recipients: z.array(SplitRecipientOuputSchema),
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
