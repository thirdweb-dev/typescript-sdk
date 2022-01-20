import { z } from "zod";

if (!global.File) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  global.File = require("@web-std/file").File;
}

export const FileBufferOrStringSchema = z.union([
  z.instanceof(File),
  z.instanceof(Buffer),
  z.string(),
]);

export const BasisPointsSchema = z
  .number()
  .min(0, "basis points cannot be less than 0")
  .max(10000, "basis points cannot be greater than 10000");

type Literal = boolean | null | number | string;
type Json = Literal | { [key: string]: Json } | Json[];
export const JsonLiteral = z.union([
  z.string().min(1, "Cannot be empty"),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const JsonSchema: z.ZodSchema<Json> = z.lazy(() =>
  z.union([JsonLiteral, z.array(JsonSchema), z.record(JsonSchema)]),
);
export const JsonObject = z.record(JsonSchema);
