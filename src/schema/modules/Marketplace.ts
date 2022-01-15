import { JsonObject } from "json2typescript";
import { Mixin } from "ts-mixer";
import {
  CommonModuleMetadata,
  CommonPlatformFeeMetadata,
  CommonTrustedForwarderMetadata,
} from "./common";

@JsonObject("MarketplaceModuleMetadata")
export class MarketplaceModuleMetadata extends CommonModuleMetadata {}

@JsonObject("DeployMarketplaceModuleMetadata")
export class DeployMarketplaceModuleMetadata extends Mixin(
  MarketplaceModuleMetadata,
  CommonTrustedForwarderMetadata,
  CommonPlatformFeeMetadata,
) {}
