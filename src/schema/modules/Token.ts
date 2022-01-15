import { JsonObject, JsonProperty } from "json2typescript";
import { Mixin } from "ts-mixer";
import { CommonModuleMetadata, CommonTrustedForwarderMetadata } from "./common";

@JsonObject("TokenModuleMetadata")
export class TokenModuleMetadata extends CommonModuleMetadata {}

@JsonObject("DeployTokenModuleMetadata")
export class DeployTokenModuleMetadata extends Mixin(
  TokenModuleMetadata,
  CommonTrustedForwarderMetadata,
) {
  /**
   * The symbol for the Currency (required)
   */
  @JsonProperty("symbol", String)
  symbol = "";
}
