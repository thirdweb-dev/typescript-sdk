import { FORWARDER_ADDRESS } from "../constants/addresses";
import { z } from "zod";

export const SDKOptionsSchema = z
  .object({
    readOnlyRpcUrl: z.string().url().optional(),
    gasSettings: z
      .object({
        maxPriceInGwei: z
          .number()
          .min(1, "gas price cannot be less than 1")
          .default(300),
        speed: z
          .enum(["safeLow", "standard", "fast", "fastest"])
          .default("fastest"),
      })
      .default({ maxPriceInGwei: 300, speed: "fastest" }),
    gasless: z
      .union([
        z.object({
          openzeppelin: z.object({
            relayerUrl: z.string().url(),
            relayerForwarderAddress: z.string().default(FORWARDER_ADDRESS),
          }),
        }),
        z.object({
          biconomy: z.object({
            apiId: z.string(),
            apiKey: z.string(),
            deadlineSeconds: z
              .number()
              .min(1, "deadlineSeconds cannot be les than 1")
              .default(3600),
          }),
        }),
      ])
      .optional(),
  })
  .default({
    gasSettings: { maxPriceInGwei: 300, speed: "fastest" },
  });

export type SDKOptions = z.input<typeof SDKOptionsSchema>;
export type SDKOptionsOutput = z.output<typeof SDKOptionsSchema>;
