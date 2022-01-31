import { JsonObject } from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";
import { NewSplitRecipient } from "./NewSplitRecipient";

@JsonObject("SplitsModuleMetadata")
export class SplitsModuleMetadata extends CommonModuleMetadata {
  recipientSplits: NewSplitRecipient[] = [];
  isRoyalty = false;
}

export default SplitsModuleMetadata;
