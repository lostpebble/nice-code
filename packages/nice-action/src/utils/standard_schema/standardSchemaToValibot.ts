import type { StandardSchemaV1 } from "@standard-schema/spec";
import * as v from "valibot";

/**
 * Converts a Standard Schema V1 into a Valibot-compatible schema.
 */
export function standardSchemaObjectToValibot<TOutput, TInput>(
  externalSchema: StandardSchemaV1<TInput, TOutput>,
): v.BaseSchema<TInput, TOutput, any> & {
  ["~standard"]: StandardSchemaV1<TInput, TOutput>;
} {
  return {
    kind: "schema",
    type: "object",
    reference: standardSchemaObjectToValibot,
    expects: "unknown",
    async: false,
    "~standard": externalSchema["~standard"], // Pass through the standard property
    _run(dataset: any) {
      // Execute the external schema's validation logic
      const result = externalSchema["~standard"].validate(dataset.value);

      // Handle Sync vs Async results (Standard Schema supports both)
      if (result instanceof Promise) {
        throw new Error("This wrapper only supports synchronous validation.");
      }

      if (result.issues) {
        dataset.issues = result.issues as any;
        return dataset;
      }

      dataset.value = result.value;
      return dataset;
    },
  };
}
