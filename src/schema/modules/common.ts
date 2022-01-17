import { AddressZero } from "@ethersproject/constants";
import {
  JsonObject,
  JsonProperty,
  PropertyConvertingMode,
} from "json2typescript";
import { FORWARDER_ADDRESS } from "../../common/address";
// import { FileOrBuffer } from "../FileOrBuffer";

/**
 * CommonModuleMetadata defines the common properties of a module.
 */
@JsonObject("CommonModuleMetadata")
export class CommonModuleMetadata {
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
   * An image for the module.
   *
   * If the image is a File or Buffer, it will be uploaded to IPFS.
   * If the image is a string, it will be used as-is (in case you already uploaded it to IPFS
   * and the property is the IPFS hash uri).
   */
  @JsonProperty("image", String, PropertyConvertingMode.IGNORE_NULLABLE)
  image?: string = undefined;

  /**
   * An external link for the module.
   */
  @JsonProperty("external_link", String, PropertyConvertingMode.IGNORE_NULLABLE)
  externalLink?: string = undefined;
}

@JsonObject("CommonRoyaltyMetadata")
export class CommonRoyaltyMetadata {
  /**
   * The amount of royalty collected on all royalties represented as basis points.
   * The default is 0 (no royalties).
   *
   * 1 basis point = 0.01%
   *
   * For example: if this value is 100, then the royalty is 1% of the total sales.
   *
   *  @internalremarks used by OpenSea "seller_fee_basis_points"
   */
  @JsonProperty(
    "seller_fee_basis_points",
    Number,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  royaltyBps = 0;
  /**
   * The address of the royalty recipient. All royalties will be sent
   * to this address.
   * @internalremarks used by OpenSea "fee_recipient"
   */
  @JsonProperty("fee_recipient", String, PropertyConvertingMode.IGNORE_NULLABLE)
  royaltyReceipient: string = AddressZero;
}

@JsonObject("CommonPlatformFeeMetadata")
export class CommonPlatformFeeMetadata {
  /**
   * platform fee basis points
   */
  @JsonProperty(
    "platform_fee_basis_points",
    Number,
    PropertyConvertingMode.IGNORE_NULLABLE,
  )
  platformFeeBps = 0;

  /**
   * platform fee recipient address
   */
  @JsonProperty("platform_fee_recipient_address", String)
  platformFeeRecipient = AddressZero;
}

// FORWARDER_ADDRESS

@JsonObject("CommonTrustedForwarderMetadata")
export class CommonTrustedForwarderMetadata {
  /**
   * the trusted forwarder address for gasless transactions
   */
  @JsonProperty("trusted_forwarder_address", String)
  trustedForwarderAddress = FORWARDER_ADDRESS;
}
