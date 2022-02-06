import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
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

export const SplitsModuleInput = CommonModuleSchema.extend({
  recipientSplits: z.array(SplitRecipientInputSchema).default([]),
});

export const SplitsModuleOutput = CommonModuleOutputSchema.extend({
  recipientSplits: z.array(SplitRecipientOuputSchema),
});

export const SplitsModuleDeploy = SplitsModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(SplitsModuleInput);

export const SplitsModuleSchema = {
  deploy: SplitsModuleDeploy,
  output: SplitsModuleOutput,
  input: SplitsModuleInput,
};
