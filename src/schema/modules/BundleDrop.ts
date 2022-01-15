import { AddressZero } from "@ethersproject/constants";
import { JsonObject, JsonProperty } from "json2typescript";
import { Mixin } from "ts-mixer";
import {
  CommonModuleMetadata,
  CommonRoyaltyMetadata,
  CommonPlatformFeeMetadata,
  CommonTrustedForwarderMetadata,
} from "./common";

@JsonObject("BundleDropModuleMetadata")
export class BundleDropModuleMetadata extends Mixin(
  CommonModuleMetadata,
  CommonRoyaltyMetadata,
) {}

@JsonObject("DeployBundleDropModuleMetadata")
export class DeployBundleDropModuleMetadata extends Mixin(
  BundleDropModuleMetadata,
  CommonPlatformFeeMetadata,
  CommonTrustedForwarderMetadata,
) {
  /**
   * primary sale recipient address
   */
  @JsonProperty("primary_sale_recipient_address", String)
  primarySaleRecipient = AddressZero;
}
