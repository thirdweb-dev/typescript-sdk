import { JsonObject, JsonProperty } from "json2typescript";
import { Mixin } from "ts-mixer";
import { CommonModuleMetadata, CommonTrustedForwarderMetadata } from "./common";

@JsonObject("VoteModuleMetadata")
export class VoteModuleMetadata extends CommonModuleMetadata {}

@JsonObject("DeployVoteModuleMetadata")
export class DeployVoteModuleMetadata extends Mixin(
  VoteModuleMetadata,
  CommonTrustedForwarderMetadata,
) {
  /**
   * The wait time before a proposal can begin being voted on (seconds).
   */
  @JsonProperty("proposal_start_time_in_seconds", Number)
  proposalStartWaitTimeInSeconds = 0;

  /**
   * How long a proposal is open for voting (seconds).
   */
  @JsonProperty("proposal_voting_time_in_seconds", Number)
  proposalVotingTimeInSeconds = 0;

  /**
   * The ERC20 token address that is used in the voting process.
   */
  @JsonProperty("voting_token_address", String)
  votingTokenAddress = "";

  /**
   * Quorum required for a proposal to be successful. This value should be between 0-100 and represents a percentage.
   *
   * By default it is set to 0.
   */
  @JsonProperty("voting_quorum_fraction", Number)
  votingQuorumFraction = 0;

  /**
   * The minimum number of tokens required to propose a proposal.
   */
  @JsonProperty("proposal_token_threshold", Number)
  minimumNumberOfTokensNeededToPropose = 0;
}
