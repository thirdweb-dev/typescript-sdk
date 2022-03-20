import { z } from "zod";
import {
  FileBufferOrStringSchema,
  JsonObjectSchema,
  JsonSchema,
} from "../../shared";

const ValidPropertyValue = JsonSchema.or(FileBufferOrStringSchema);
const _optionalProperties = z
  .union([
    z
      .array(
        z.object({
          key: z.string(),
          value: ValidPropertyValue,
        }),
      )

      .superRefine((val, ctx) => {
        if (!val) {
          return;
        }
        const keyCount: Record<string, number> = {};

        val.forEach(({ key }, idx) => {
          if (!keyCount[key]) {
            keyCount[key] = 0;
          }

          keyCount[key]++;
          if (keyCount[key] > 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate key: ${key}`,
              path: [idx, "key"],
            });
          }
        });
      }),
    z.record(ValidPropertyValue),
  ])
  .optional();

/**
 * @internal
 */
export const OptionalPropertiesInput = z
  .preprocess((val) => {
    const knownVal = val as z.input<typeof _optionalProperties>;

    if (Array.isArray(knownVal)) {
      return knownVal.filter((v) => v.value);
    }
    return knownVal;
  }, _optionalProperties)
  .transform((properties) => {
    if (Array.isArray(properties)) {
      return properties.reduce(
        (acc, prop) => ({ ...acc, ...{ [prop.key]: prop.value } }),
        {} as Record<string, z.input<typeof ValidPropertyValue>>,
      );
    }
    return properties;
  });

/**
 * @internal
 */
export const OptionalPropertiesOutput = JsonObjectSchema.optional();
