import { sValidator } from "@hono/standard-validator";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { MiddlewareHandler, ValidationTargets } from "hono";
import { EValidator, err_validation } from "../validation/err_validation";

export function niceValidator<
  Schema extends StandardSchemaV1,
  Target extends keyof ValidationTargets,
>(target: Target, schema: Schema) {
  return sValidator(target, schema, (result) => {
    if (!result.success) {
      throw err_validation.fromId(EValidator.valibot, { issues: result.error });
    }
  });
}

export function catchValidationError(): MiddlewareHandler {
  return async (ctx, next) => {
    // 1. Execute downstream routes and wait for them to finish
    await next();

    // 2. Clone the response so we don't consume the original body stream
    const clonedResponse = ctx.res.clone();

    // 3. Safely check if the response is actually JSON
    const contentType = clonedResponse.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        // 4. Parse the JSON from the cloned response
        const responseJson = await clonedResponse.json();

        console.log("Intercepted JSON:", responseJson);
      } catch (error) {
        console.error("Failed to parse response JSON:", error);
      }
    }
  };
}
