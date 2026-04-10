import { env } from "cloudflare:workers";
import { sValidator } from "@hono/standard-validator";
import { castNiceError, EErrorPackType } from "@nice-error/core";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { demo_err_nice, EErrId_DemoNiceBackend, errorGlobalEnv } from "../../errors/demo_err_nice";
import { vSimpleObject } from "../validation/test_valibot_validation.schema";

const honoApi = new Hono();

honoApi.onError((err, ctx) => {
  errorGlobalEnv.packAs = EErrorPackType.msg_pack;
  const niceError = castNiceError(err);

  return ctx.json(
    niceError.toJsonObject(),
    (niceError.httpStatusCode as ContentfulStatusCode) ?? 500,
  );
});

honoApi.get("/throw_error/no_context", async (c) => {
  throw demo_err_nice.fromId(EErrId_DemoNiceBackend.simple_error_no_context);
});

honoApi.get("/throw_error/with_context", async (c) => {
  throw demo_err_nice.fromId(EErrId_DemoNiceBackend.error_with_context, {
    detail: "TEST_CONTEXT_DETAIL",
  });
});

honoApi.get("/throw_error/with_serializable_context", async (c) => {
  throw demo_err_nice.fromId(EErrId_DemoNiceBackend.error_with_serializable_context, {
    dateNow: new Date(),
  });
});

honoApi.use(async (ctx, next) => {
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
});

honoApi.post("/throw_validation/valibot", sValidator("json", vSimpleObject), async (c) => {
  const validatedData = c.req.valid("json");
  return c.json({ message: "Validation succeeded", data: validatedData });
});

honoApi.get("/dur_obj/no_context", async (c) => {
  const id = env.DO_EXAMPLE_USER.idFromName("example");
  const stub = env.DO_EXAMPLE_USER.get(id);
  await stub.throwErrorNoContext();
});

honoApi.get("/dur_obj/with_context", async (c) => {
  const id = env.DO_EXAMPLE_USER.idFromName("example");
  const stub = env.DO_EXAMPLE_USER.get(id);
  await stub.throwErrorWithContext();
});

honoApi.get("/dur_obj/with_serializable_context", async (c) => {
  const id = env.DO_EXAMPLE_USER.idFromName("example");
  const stub = env.DO_EXAMPLE_USER.get(id);
  await stub.throwErrorWithSerializableContext();
});

export { honoApi };
