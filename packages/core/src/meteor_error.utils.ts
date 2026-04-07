import { notNullEmpty } from "@meteorwallet/utils/javascript_type_utils/string.utils";
import type { TMeteorErrorInterpreter } from "./MeteorError";
import { MeteorError } from "./MeteorError";
import type { TMeteorErrorUnknown} from "./subtype/merr_unknown";
import { EErrIdUnknown, merr_unknown } from "./subtype/merr_unknown";
import { getAllMeteorErrorSubtypes } from "./utils/getAllMeteorErrorSubtypes";
import { jsErrorOrCastJsError } from "./utils/jsErrorOrCastJsError";

function createUnknownError(e: unknown, logMessage = true): TMeteorErrorUnknown {
  const castError = jsErrorOrCastJsError(e, logMessage);

  const error = merr_unknown
    .fromId(EErrIdUnknown.unhandled_error, castError)
    .withMessage(castError.message)
    .withOriginError(e);

  error.isUnknownError = true;
  return error;
}

function meteorOrUnknownError(
  e: unknown,
  logMessage = true,
): typeof e extends MeteorError<infer N, infer E, infer C> ? MeteorError<N, E, C> : MeteorError {
  const errCast = MeteorError.castOrNull(e);

  if (errCast) {
    if (logMessage) {
      console.error(`An error was thrown: ${errCast.message}`, e);
    }
    return errCast;
  }

  return createUnknownError(e, logMessage);
}

function wrapWithOriginError<T>(originError: any, handler: () => T): T {
  const err = handler();

  if (MeteorError.isMeteorError(err)) {
    err.withOriginError(originError);
  }

  return err;
}

function createErrorInterpreter<T extends MeteorError>(
  handler: (e: any) => T | undefined,
  skipMeteorErrors = false,
): TMeteorErrorInterpreter<T> {
  return (e: any) => {
    if (skipMeteorErrors && e instanceof MeteorError) {
      return e as T;
    }

    const interpretedError = handler(e);

    if (interpretedError) {
      interpretedError.withOriginError(e);
    }

    return interpretedError;
  };
}

function interpretError<T extends MeteorError>(
  e: any,
  handler: (e: any) => T | undefined,
): MeteorError {
  try {
    // console.log(`Interpreting error: ${e.name}:${e.subtype} ${e.message}`, e);
    const interpretedError = handler(e);

    if (interpretedError) {
      const originMessage = interpretedError.originError?.message;
      console.error(
        `Meteor Error Interpreted ${interpretedError.idsText}${notNullEmpty(originMessage) ? `: (${originMessage})` : ""}`,
        interpretedError,
      );
      return interpretedError;
    }

    const unknownError = meteorOrUnknownError(e);
    console.error(`Unknown error: ${unknownError.message}`, unknownError.originError);
    return unknownError;
  } catch (e) {
    const unknownError = meteorOrUnknownError(e);
    console.error(
      `Interpreting error failed internally: ${unknownError.message}`,
      unknownError.originError,
    );
    return unknownError;
  }
}

export const meteor_error_utils = {
  meteorOrUnknownError,
  createUnknownError,
  createErrorInterpreter,
  jsErrorOrCastJsError,
  wrapWithOriginError,
  interpretError,
  getAllMeteorErrorSubtypes,
};
