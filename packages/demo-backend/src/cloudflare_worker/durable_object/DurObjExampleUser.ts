import { DurableObject } from "cloudflare:workers";
import { durObjPack } from "@nice-error/core";
import { demo_err_nice, EErrId_DemoNiceBackend } from "../../errors/demo_err_nice";

export class DurObjExampleUser extends DurableObject {
  async throwErrorNoContext() {
    throw durObjPack(demo_err_nice.fromId(EErrId_DemoNiceBackend.simple_error_no_context));
  }

  async throwErrorWithContext() {
    throw durObjPack(
      demo_err_nice.fromId(EErrId_DemoNiceBackend.error_with_context, {
        detail: "TEST_CONTEXT_DETAIL",
      }),
    );
  }
}
