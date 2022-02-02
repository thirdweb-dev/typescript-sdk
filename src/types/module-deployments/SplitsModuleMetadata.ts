import { JsonObject, JsonProperty } from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";
import { NewSplitRecipient } from "./NewSplitRecipient";

@JsonObject("SplitsModuleMetadata")
export class SplitsModuleMetadata extends CommonModuleMetadata {
  recipientSplits: NewSplitRecipient[] = [];

  @JsonProperty("is_royalty", Boolean)
  isRoyalty = false;
}

export default SplitsModuleMetadata;
