import { JsonObject } from "json2typescript";
import { Mixin } from "ts-mixer";
import {
  CommonModuleMetadata,
  CommonRoyaltyMetadata,
  CommonTrustedForwarderMetadata,
} from "./common";

@JsonObject("BundleCollectionMetadata")
export class BundleCollectionMetadata extends Mixin(
  CommonModuleMetadata,
  CommonRoyaltyMetadata,
) {}

@JsonObject("DeployBundleCollectionMetadata")
export class DeployBundleCollectionMetadata extends Mixin(
  BundleCollectionMetadata,
  CommonTrustedForwarderMetadata,
) {}
