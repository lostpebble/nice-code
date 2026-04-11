import { sValidator } from "@hono/standard-validator";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { ValidationTargets } from "hono";
import { EValidator, err_validation } from "../validation/err_validation";

export function niceSValidator<
  Schema extends StandardSchemaV1,
  Target extends keyof ValidationTargets,
>(target: Target, schema: Schema) {
  return sValidator(target, schema, (result) => {
    if (!result.success) {
      throw err_validation.fromId(EValidator.standard_schema, {
        issues: result.error,
      });
    }
  });
}
