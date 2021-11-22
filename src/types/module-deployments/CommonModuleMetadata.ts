import {
  JsonObject,
  JsonProperty,
  PropertyConvertingMode,
} from "json2typescript";

/**
 * CommonModuleMetadata defines the common properties of a module deployment.
 */
@JsonObject("CommonModuleMetadata")
export default class CommonModuleMetadata {
  /**
   * The name of the module.
   */
  @JsonProperty("name", String)
  name = "";

  /**
   * The description of the module.
   */
  @JsonProperty("description", String, PropertyConvertingMode.IGNORE_NULLABLE)
  description?: string = undefined;

  /**
   * An image URI for the module.
   */
  @JsonProperty("image", String, PropertyConvertingMode.IGNORE_NULLABLE)
  image?: string = undefined;

  /**
   * An external link for the module.
   */
  @JsonProperty("external_link", String, PropertyConvertingMode.IGNORE_NULLABLE)
  externalLink?: string = undefined;
}
