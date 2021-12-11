import { JsonObject, JsonProperty } from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";

@JsonObject("VoteModuleMetadata")
export default class VoteModuleMetadata extends CommonModuleMetadata {
  @JsonProperty("voting_delay", Number)
  votingDelay = 0;

  @JsonProperty("voting_period", Number)
  votingPeriod = 0;

  @JsonProperty("voting_token_address", String)
  votingTokenAddress = "";

  @JsonProperty("voting_quorum_fraction", Number)
  votingQuorumFraction = 0;

  @JsonProperty("proposal_token_threshold", String)
  proposalTokenThreshold = "0";
}
