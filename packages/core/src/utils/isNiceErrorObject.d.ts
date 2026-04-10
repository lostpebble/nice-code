import { type INiceErrorJsonObject } from "../NiceError/NiceError.types";
/**
 * Returns `true` if `obj` is a JSON-serialised `NiceError` object matching the
 * current wire format (contextState-based errorData entries).
 *
 * Validates:
 * - Top-level shape (`name`, `message`, `wasntNice`, `httpStatusCode`, `def`)
 * - Each `errorData` entry has a `contextState` with a valid `kind` discriminant
 *   (`"no_serialization"` or `"unhydrated"`) — rejecting payloads in the old
 *   format (`context` / `serialized` fields) to prevent silent data corruption.
 */
export declare function isNiceErrorObject(obj: unknown): obj is INiceErrorJsonObject;
