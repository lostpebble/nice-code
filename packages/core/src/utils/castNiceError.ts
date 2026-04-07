import { NiceError } from "../NiceError";
import { isNiceErrorObject } from "./isNiceErrorObject";

export const castNiceError = (error: unknown): NiceError => {
  let err: NiceError;

  if (error == null) {
    err = new NiceError("Unknown error: null or undefined");
    err.cause = error;
    return err;
  }

  if (typeof error === "object" && error != null) {
    // Check for object properties that match NiceError and re-create it as a NiceError
    // Otherwise, we need to create an "unknown" NiceError with the original error as the cause

    if (isNiceErrorObject(error)) {
      // Re-create the NiceError instance with the properties from the original NiceError object
    }
  }
};
