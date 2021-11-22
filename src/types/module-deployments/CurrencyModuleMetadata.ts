import { JsonObject, JsonProperty } from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";

@JsonObject("CurrencyModuleMetadata")
export default class CurrencyModuleMetadata extends CommonModuleMetadata {
  /**
   * The symbol for the Currency (required)
   */
  @JsonProperty("symbol", String)
  symbol = "";
}
