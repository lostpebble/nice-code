import type { TErrorContext } from "./MeteorError.types";
import { createMeteorErrorSubtype } from "./subtype";

export enum EErrId_UserErrorExample {
  example_error_id_with_context = "example_error_id_with_context",
  example_error_id_without_context = "example_error_id_without_context",
}

export const merr_user_error_example = createMeteorErrorSubtype<
  "merr_user_error_example",
  EErrId_UserErrorExample
>("merr_user_error_example", {
  [EErrId_UserErrorExample.example_error_id_with_context]: {
    context: {
      required: true,
      type: {} as boolean,
    },
    message(params) {
      return params.context === true
        ? "Error message for true context"
        : "Error message for false context";
    },
    httpStatusCode: 400,
  },
  [EErrId_UserErrorExample.example_error_id_without_context]: {
    message: "Error message without context",
    httpStatusCode: 401,
  },
} as const satisfies TErrorContext<string>);

function runThingAndThrow() {
  throw merr_user_error_example.fromId(EErrId_UserErrorExample.example_error_id_with_context, true);
}

function runThingAndThrowWithoutContext() {
  throw merr_user_error_example.fromId(EErrId_UserErrorExample.example_error_id_without_context);
}
