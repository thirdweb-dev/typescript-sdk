import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonTrustedForwarderSchema,
} from "./common";
import { BigNumberishSchema, BigNumberSchema } from "../shared";
import { z } from "zod";
import { AddressZero } from "@ethersproject/constants";
import { BigNumber } from "ethers";

export const VoteSettingsInputSchema = z.object({
  proposal_start_time_in_seconds: z.number().default(0),
  proposal_voting_time_in_seconds: z.number().default(0),
  voting_delay_in_blocks: z.number().default(0),
  voting_period_in_blocks: z.number().default(1),
  voting_token_address: z.string().default(AddressZero),
  voting_quorum_fraction: z.number().default(0),
  proposal_token_threshold: BigNumberishSchema,
});

export const VoteSettingsOuputSchema = VoteSettingsInputSchema.extend({
  proposal_token_threshold: BigNumberSchema,
});

export const VoteModuleInput = CommonModuleSchema.merge(
  VoteSettingsInputSchema,
);

export const VoteModuleOutput = CommonModuleOutputSchema.merge(
  VoteSettingsOuputSchema,
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
  proposalId: BigNumberSchema,
  proposer: z.string(),
  targets: z.array(z.string()),
  values: z.array(BigNumberSchema),
  signatures: z.array(z.string()),
  calldatas: z.array(z.string()),
  startBlock: BigNumberSchema,
  endBlock: BigNumberSchema,
  description: z.string(),
});
