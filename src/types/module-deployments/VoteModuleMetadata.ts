import { JsonObject, JsonProperty } from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";

@JsonObject("VoteModuleMetadata")
export default class VoteModuleMetadata extends CommonModuleMetadata {
  @JsonProperty("voting_delay", Number)
  votingDelay = 0;

  @JsonProperty("voting_period", Number)
  votingPeriod = 0;

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
  @JsonProperty("proposal_token_threshold", String)
  minimumNumberOfTokensNeededToPropose = "0";
}
