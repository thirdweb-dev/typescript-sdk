import { z } from "zod";
import {
  CommonModuleOutputSchema,
  CommonModuleSchema,
  CommonPlatformFeeSchema,
  CommonRoyaltySchema,
  CommonTrustedForwarderSchema,
} from "./common";

export const DropErc721ModuleInput =
  CommonModuleSchema.merge(CommonRoyaltySchema);

export const DropErc721ModuleOutput = CommonModuleOutputSchema.merge(
  CommonRoyaltySchema,
).extend({
  merkle: z.record(z.string()).default({}),
});

export const DropErc721ModuleDeploy = DropErc721ModuleInput.merge(
  CommonPlatformFeeSchema,
).merge(CommonTrustedForwarderSchema);
