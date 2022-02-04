import { BigNumber } from "ethers";
import { z } from "zod";
import { Json } from "../core/types";

if (!globalThis.File) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  globalThis.File = require("@web-std/file").File;
}

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

export const BytesLikeSchema = z.union([z.array(z.number()), z.string()]);

export const BigNumberSchema = z
  .union([z.string(), z.number(), z.bigint(), z.instanceof(BigNumber)])
  .transform((arg) => BigNumber.from(arg));


export const BigNumberishSchema = BigNumberSchema.transform((arg) =>
  arg.toString(),
);

export const BasisPointsSchema = z
  .number()
  .max(10_000, "Cannot exeed 100%")
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
