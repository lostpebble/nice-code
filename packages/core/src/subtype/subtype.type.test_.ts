import type { MeteorError, TMeteorErrorSubtype } from "../MeteorError";
import type { TErrorContext } from "../MeteorError.types";
import { createMeteorErrorSubtype } from "./createMeteorErrorSubtype";
import type { TMeteorErrorUnknown} from "./merr_unknown";
import { EErrIdUnknown, merr_unknown } from "./merr_unknown";

export function takeErr(err: TMeteorErrorUnknown) {
  err.hasId(EErrIdUnknown.unhandled_error);

  // Should be error
  // err.hasId("asd");

  // Should be error type
  const something = err.getContextForId(EErrIdUnknown.unhandled_error);
}

export function takeErr2(err: MeteorError) {
  err.hasId("asd");
}

takeErr(merr_unknown.fromId(EErrIdUnknown.unhandled_error));
takeErr2(merr_unknown.fromId(EErrIdUnknown.unhandled_error));

interface ITestObj {
  error: MeteorError;
}

const unhandledErrorFit: ITestObj = {
  error: merr_unknown.fromId(EErrIdUnknown.unhandled_error),
};

export enum EErr_TestError {
  test_error_id_without_context = "test_error_id_without_context",
  test_error_id_with_context = "test_error_id_one",
}

const TestErrorWithContext = createMeteorErrorSubtype<"TestError", EErr_TestError>(
  "TestError",
  {
    [EErr_TestError.test_error_id_with_context]: {
      context: { required: true, type: {} as { color: string } },
    },
  } as const satisfies TErrorContext<EErr_TestError>,
);

type TTestErrorWithContext = TMeteorErrorSubtype<typeof TestErrorWithContext>;

const otherErrorWithoutContext: TTestErrorWithContext = TestErrorWithContext.fromId(
  EErr_TestError.test_error_id_without_context,
);

const otherErrorWithContext = TestErrorWithContext.fromId(
  EErr_TestError.test_error_id_with_context,
  {
    color: "red",
  },
);

interface ISomethingWithAnyError {
  error: MeteorError;
}

const objWithoutContext: ISomethingWithAnyError = {
  error: otherErrorWithoutContext,
};

const objWithContext: ISomethingWithAnyError = {
  error: otherErrorWithContext,
};
