import {
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const DropErc20MetadataSchema =
  CommonModuleSchema.merge(CommonRoyaltySchema);

export const DropErc20DeploySchema = DropErc20MetadataSchema.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);
