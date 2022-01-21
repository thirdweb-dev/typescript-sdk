import { FORWARDER_ADDRESS } from "../constants/addresses";
import { DEFAULT_IPFS_GATEWAY } from "../constants/urls";
import { z } from "zod";

export const SDKOptionsSchema = z.object({
  ipfsGateway: z.string().url().default(DEFAULT_IPFS_GATEWAY).optional(),
  readOnlyRpcUrl: z.string().url().optional(),
  gasSettings: z
    .object({
      maxPriceInGwei: z
        .number()
        .min(1, "gas price cannot be less than 1")
        .default(300)
        .optional(),
      speed: z
        .enum(["safeLow", "standard", "fast", "fastest"])
        .default("fastest")
        .optional(),
    })
    .default({ maxPriceInGwei: 300, speed: "fastest" })
    .optional(),
  gasless: z
    .union([
      z.object({
        openzeppelin: z.object({
          relayerUrl: z.string().url(),
          relayerForwarderAddress: z
            .string()
            .default(FORWARDER_ADDRESS)
            .optional(),
        }),
      }),
      z.object({
        biconomy: z.object({
          apiId: z.string(),
          apiKey: z.string(),
          deadlineSeconds: z
            .number()
            .min(1, "deadlineSeconds cannot be les than 1")
            .default(3600)
            .optional(),
        }),
      }),
    ])
    .optional(),
});

export type SDKOptions = z.infer<typeof SDKOptionsSchema>;
