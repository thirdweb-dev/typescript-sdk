import {
  JsonObject,
  JsonProperty,
  PropertyConvertingMode,
} from "json2typescript";
import CommonModuleMetadata from "./CommonModuleMetadata";

@JsonObject("DropModuleMetadata")
export default class DropModuleMetadata extends CommonModuleMetadata {
  /**
   * The amount of royalty collected on all royalties represented as basis points.
   * The default is 0 (no royalties).
   *
   * 1 basis point = 0.01%
   *
   * For example: if this value is 100, then the royalty is 1% of the total sales.
   */
  @JsonProperty(
    "seller_fee_basis_points",
    Number,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  sellerFeeBasisPoints = 0;

  /**
   * The address of the royalty recipient. All royalties will be sent
   * to this address.
   */
  @JsonProperty("fee_recipient", String, PropertyConvertingMode.IGNORE_NULLABLE)
  feeRecipient?: string = undefined;

  /**
   * The symbol for the Drop Collection
   */
  @JsonProperty("symbol", String, PropertyConvertingMode.IGNORE_NULLABLE)
  symbol?: string;

  /**
   * The max supply (required)
   */
  @JsonProperty("max_supply", Number, PropertyConvertingMode.IGNORE_NULLABLE)
  maxSupply = 1;

  /**
   * The IPFS base URI thats prepended to all token URIs. This allows
   * you to batch upload all the metadata for the tokens ahead of time
   * so they can be lazy minted later
   *
   * e.g. if a Drop Collection has a token URI of /ipfs/BOREDAPES/TOKEN1, then the IPFS base URI is /BOREDAPES/
   */
  @JsonProperty(
    "base_token_uri",
    String,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  baseTokenUri = "";
}
