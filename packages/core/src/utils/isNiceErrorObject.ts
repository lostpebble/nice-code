import { NiceError } from "../NiceError";

export function isNiceErrorObject(error: unknown): error is NiceError {
  return error instanceof NiceError;
}
