import { z } from "zod";
import { JsonObjectSchema } from "../../shared";

/**
 * @internal
 */
export const OptionalPropertiesInput = z.union([
  z.array(JsonObjectSchema),
  JsonObjectSchema,
]);

/**
 * @internal
 */
export const OptionalPropertiesOutput = JsonObjectSchema.optional();
