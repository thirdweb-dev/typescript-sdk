import { BigNumber } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { z } from "zod";
import { Json } from "../core/types";

if (!globalThis.File) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.File = require("@web-std/file").File;
}

export const MAX_BPS = 10_000;

const isBrowser = () => typeof window !== "undefined";

const fileOrBufferUnion = isBrowser()
  ? ([z.instanceof(File), z.string()] as [
      z.ZodType<InstanceType<typeof File>>,
      z.ZodString,
    ])
  : ([z.instanceof(Buffer), z.string()] as [
      z.ZodTypeAny, // @fixme, this is a hack to make browser happy for now
      z.ZodString,
    ]);

export const FileBufferOrStringSchema = z.union(fileOrBufferUnion);
export type FileBufferOrString = z.output<typeof FileBufferOrStringSchema>;

export const BytesLikeSchema = z.union([z.array(z.number()), z.string()]);

// TODO z.instance(BigNumber) might not be compatible with the caller's version of ethers BigNumber
export const BigNumberSchema = z
  .union([z.string(), z.number(), z.bigint(), z.instanceof(BigNumber)])
  .transform((arg) => BigNumber.from(arg));

export const BigNumberishSchema = BigNumberSchema.transform((arg) =>
  arg.toString(),
);

export const BasisPointsSchema = z
  .number()
  .max(MAX_BPS, "Cannot exeed 100%")
  .min(0, "Cannot be below 0%");

export const JsonLiteral = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const JsonSchema: z.ZodSchema<Json> = z.lazy(() =>
  z.union([JsonLiteral, z.array(JsonSchema), z.record(JsonSchema)]),
);
export const JsonObjectSchema = z.record(JsonSchema);
export const HexColor = z.union([
  z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
    .transform((val) => val.replace("#", "")),
  z.string().length(0),
]);

export const AdressSchema = z.string().refine(
  (arg) => isAddress(arg),
  (out) => {
    return {
      message: `${out} is not a valid address`,
    };
  },
);

export const PriceSchema = z
  .union([
    z.string().regex(/^([0-9]+\.?[0-9]*|\.[0-9]+)$/, "Invalid price"),
    z.number().min(0, "Price cannot be negative"),
  ])
  .transform((arg) => (typeof arg === "number" ? arg.toString() : arg));

export const DateSchema = z
  .date()
  .default(new Date())
  .transform((i) => {
    return BigNumber.from(Math.floor(i.getTime() / 1000));
  });
