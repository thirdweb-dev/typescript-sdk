import { JsonObject } from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";
import { NewSplitRecipient } from "./NewSplitRecipient";

@JsonObject("SplitsModuleMetadata")
export default class SplitsModuleMetadata extends CommonModuleMetadata {
  recipientSplits: NewSplitRecipient[] = [];
}
