import { z } from "zod";
import { FileBufferOrStringSchema, JsonLiteral } from "../../shared";

const ValidPropertyValue = JsonLiteral.or(FileBufferOrStringSchema);
const _optionalProperties = z
  .array(
    z.object({
      key: z.string(),
      value: ValidPropertyValue,
    }),
  )
  .optional()
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
  });

export const OptionalPropertiesInput = z
  .preprocess((val) => {
    const knownVal = val as z.infer<typeof _optionalProperties>;
    // if it exist...
    if (Array.isArray(knownVal)) {
      // run over it

      return knownVal.reduce((acc, curr) => {
        // check if the key has a length
        // if it does then add it back
        if (curr.key.length) {
          acc.push(curr);
        }

        return acc;
      }, [] as NonNullable<z.infer<typeof _optionalProperties>>);
    }
    return knownVal;
  }, _optionalProperties)
  .transform((properties) => {
    if (!properties) {
      return properties;
    }

    return properties.reduce(
      (acc, prop) => ({ ...acc, ...{ [prop.key]: prop.value } }),
      {} as Record<string, z.input<typeof ValidPropertyValue>>,
    );
  });

export const OptionalPropertiesOutput = z.record(JsonLiteral).optional();
