import type { TMeteorErrorSubtype } from "../MeteorError";
import type { TErrorContext } from "../MeteorError.types";
import { createMeteorErrorSubtype } from "./createMeteorErrorSubtype";

export enum EErrIdUnknown {
  unhandled_error = "unhandled_error",
}

export const merr_unknown = createMeteorErrorSubtype<"merr_unknown", EErrIdUnknown>(
  "merr_unknown",
  {
    [EErrIdUnknown.unhandled_error]: {
      context: {
        required: true,
        type: {} as Error,
      },
      message: "Unhandled error",
    },
  } as const satisfies TErrorContext<EErrIdUnknown>,
);

export type TMeteorErrorUnknown = TMeteorErrorSubtype<typeof merr_unknown>;

