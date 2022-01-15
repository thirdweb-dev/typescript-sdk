import { JsonObject } from "json2typescript";
import { Mixin } from "ts-mixer";
import {
  CommonModuleMetadata,
  CommonRoyaltyMetadata,
  CommonTrustedForwarderMetadata,
} from "./common";

@JsonObject("PackModuleMetadata")
export class PackModuleMetadata extends Mixin(
  CommonModuleMetadata,
  CommonRoyaltyMetadata,
) {}

@JsonObject("DeployPackModuleMetadata")
export class DeployPackModuleMetadata extends Mixin(
  PackModuleMetadata,
  CommonTrustedForwarderMetadata,
) {}
