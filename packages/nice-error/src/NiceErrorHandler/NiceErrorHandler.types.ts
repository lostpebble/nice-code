import type { NiceError } from "../NiceError/NiceError";

export type MaybePromise<T> = T | Promise<T>;
/**
 * Broad handler signature used internally for storage and dispatch.
 * Public-facing registration methods use narrower types (`TActionHandlerForDomain`,
 * `TActionIdHandlerForDomain`); they are cast to this for storage.
 */
export type TBroadErrorHandler<E extends NiceError = NiceError> = (
  action: E,
) => MaybePromise<unknown>;
