import type { MiddlewareHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { EValidator, err_validation } from "../validation";
import type { IErrContext_HonoStandardSchema } from "../validation/err_validation.types";

export const niceCatchSValidation = (): MiddlewareHandler => async (ctx, next) => {
  // 1. Execute downstream routes and wait for them to finish
  await next();

  if (!ctx.res.ok) {
    // 2. Clone the response so we don't consume the original body stream
    const clonedResponse = ctx.res.clone();

    // 3. Safely check if the response is actually JSON
    const contentType = clonedResponse.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        // 4. Parse the JSON from the cloned response
        const responseJson = (await clonedResponse.json()) as any;

        if (responseJson["success"] != null && responseJson["error"] != null) {
          console.log("Intercepted JSON:", responseJson);
          const result = responseJson as {
            success: false;
            error: IErrContext_HonoStandardSchema["issues"];
            data: unknown;
          };
          const newError = err_validation.fromId(EValidator.standard_schema, {
            issues: result.error,
          });
          ctx.res = undefined;
          ctx.res = new Response(JSON.stringify(newError.toJsonObject()), {
            status: newError.httpStatusCode as ContentfulStatusCode,
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
      } catch (error) {
        console.error("Failed to parse response JSON:", error);
      }
    }
  }
};
