import { NiceError } from "../NiceError/NiceError";
/**
 * Casts any unknown value into a `NiceError`.
 *
 * - If the value is already a `NiceError` instance, it is returned as-is.
 * - If the value is a plain `Error`, it is wrapped with the original as `originError`.
 * - If the value is a JSON-serialised `NiceError` object (e.g. from an API
 *   response), a best-effort `NiceError` is re-created from it.
 * - For all other values, a generic `NiceError` is created with a descriptive
 *   message.
 *
 * After casting, use `NiceErrorDefined.is(error)` to narrow the error to a
 * specific domain and access its strongly-typed ids and context.
 */
export declare const castNiceError: (error: unknown) => NiceError;
