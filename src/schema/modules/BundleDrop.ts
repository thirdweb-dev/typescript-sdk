import {
  JsonObject,
  JsonProperty,
  PropertyConvertingMode,
} from "json2typescript";
import { CommonModuleMetadata } from "./common";

@JsonObject("BundleDropModuleMetadata")
export class BundleDropModuleMetadata extends CommonModuleMetadata {
  /**
   * The amount of royalty collected on all royalties represented as basis points.
   * The default is 0 (no royalties).
   *
   * 1 basis point = 0.01%
   *
   * For example: if this value is 100, then the royalty is 1% of the total sales.
   *
   *  @internalremarks used by OpenSea
   */
  @JsonProperty(
    "seller_fee_basis_points",
    Number,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  royaltyBPS? = 0;
  /**
   * The address of the royalty recipient. All royalties will be sent
   * to this address.
   * @internalremarks used by OpenSea
   */
  @JsonProperty("fee_recipient", String, PropertyConvertingMode.IGNORE_NULLABLE)
  royaltyReceipient?: string = undefined;
}

@JsonObject("DeployBundleDropModuleMetadata")
export class DeployBundleDropModuleMetadata extends BundleDropModuleMetadata {
  /**
   * The amount of fees collected on the primary sale, represented as basis points. The default is 0.
   *
   * For example, if the primary sale is $100 and the primary fee is 1000 BPS, then the primary fee of $10
   * is distributed to the primary sale recipient.
   *
   * The destination for this fee is either the project address, or a Splits contract address
   * if it was set using the `setModuleRoyaltyTreasury` method.
   *
   * 1 basis point = 0.01%
   *
   * For example: if this value is 100, then the royalty is 1% of the total sales.
   */
  @JsonProperty(
    "primary_sale_fee_basis_points",
    Number,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  platformFeeBPS? = 0;

  @JsonProperty("primary_sale_recipient_address", String)
  primarySaleRecipient = "";

  @JsonProperty("platform_fee_recipient_address", String)
  platformFeeRecipient = "";
}
