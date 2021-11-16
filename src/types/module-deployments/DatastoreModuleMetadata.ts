import { JsonObject } from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";

@JsonObject("DatastoreModuleMetadata")
export default class DatastoreModuleMetadata extends CommonModuleMetadata {}
