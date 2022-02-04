import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonTrustedForwarderSchema,
} from "./common";
import { BigNumberishSchema, BigNumberSchema } from "../shared";
import { z } from "zod";

export const VoteSettingsInputSchema = z.object({
  proposal_start_time_in_seconds: z.number(),
  proposal_voting_time_in_seconds: z.number(),
  voting_delay: z.number(),
  voting_period: z.number(),
  voting_token_address: z.string(),
  voting_quorum_fraction: z.number(),
  proposal_token_threshold: BigNumberishSchema,
});

export const VoteModuleInput = CommonModuleSchema.merge(
  VoteSettingsInputSchema,
);

export const VoteModuleOutput = CommonModuleOutputSchema.merge(
  VoteSettingsInputSchema,
);

export const VoteModuleDeploy = VoteModuleInput.merge(
  CommonTrustedForwarderSchema,
);

export const VoteModuleSchema = {
  deploy: VoteModuleDeploy,
  output: VoteModuleOutput,
  input: VoteModuleInput,
};

export const ProposalOutputSchema = z.object({
  proposalId: BigNumberishSchema,
  proposer: z.string(),
  targets: z.array(z.string()),
  values: z.array(BigNumberSchema),
  signatures: z.array(z.string()),
  calldatas: z.array(z.string()),
  startBlock: BigNumberSchema,
  endBlock: BigNumberSchema,
  description: z.string(),
});
