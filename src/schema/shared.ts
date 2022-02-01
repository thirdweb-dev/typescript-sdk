import { BigNumber } from "ethers";
import { z } from "zod";
import { Json } from "../core/types";

if (!global.File) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.File = require("@web-std/file").File;
}

export const FileBufferOrStringSchema = z.union([
  z.instanceof(File),
  z.instanceof(Buffer),
  z.string(),
]);

export const BytesLikeSchema = z.union([z.array(z.number()), z.string()]);

export const BigNumberSchema = z.instanceof(BigNumber);

// TODO this does not serialize to JSON
export const BigNumberishSchema = z
  .union([z.string(), z.number(), z.bigint(), BigNumberSchema])
  .transform((arg) => BigNumber.from(arg));

export const BasisPointsSchema = z.number().superRefine((bn, ctx) => {
  if (bn > 10000) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      maximum: 10000,
      inclusive: true,
      type: "number",
    });
  } else if (bn < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 0,
      inclusive: true,
      type: "number",
    });
  }
});

export const JsonLiteral = z.union([
  z.string().min(1, "Cannot be empty"),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const JsonSchema: z.ZodSchema<Json> = z.lazy(() =>
  z.union([JsonLiteral, z.array(JsonSchema), z.record(JsonSchema)]),
);
export const JsonObjectSchema = z.record(JsonSchema);
export const HexColor = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color")
  .transform((val) => val.replace("#", ""));
