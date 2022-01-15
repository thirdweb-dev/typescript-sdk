import { AddressZero } from "@ethersproject/constants";
import {
  JsonObject,
  JsonProperty,
  PropertyConvertingMode,
} from "json2typescript";
import { Mixin } from "ts-mixer";
import {
  CommonModuleMetadata,
  CommonPlatformFeeMetadata,
  CommonRoyaltyMetadata,
  CommonTrustedForwarderMetadata,
} from "./common";

@JsonObject("NFTDropModuleMetadata")
export class NFTDropModuleMetadata extends Mixin(
  CommonModuleMetadata,
  CommonRoyaltyMetadata,
) {
  merkle?: { [key: string]: string };
}

@JsonObject("DeployNFTDropModuleMetadata")
export class DeployNFTDropModuleMetadata extends Mixin(
  NFTDropModuleMetadata,
  CommonPlatformFeeMetadata,
  CommonTrustedForwarderMetadata,
) {
  /**
   * The symbol for the NFT Collection
   */
  @JsonProperty("symbol", String, PropertyConvertingMode.IGNORE_NULLABLE)
  symbol = "";

  /**
   * primary sale recipient address
   */
  @JsonProperty("primary_sale_recipient_address", String)
  primarySaleRecipient = AddressZero;
}
