import type { INiceErrorJsonObject } from "@nice-error/core";
import type {
  INiceActionDomain,
  TInferInputFromSchema,
  TInferOutputFromSchema,
} from "../ActionDomain/NiceActionDomain.types";

export interface INiceAction<
  DOM extends INiceActionDomain,
  ID extends keyof DOM["actions"] & string,
> {
  id: ID;
  domain: DOM["domain"];
  allDomains: DOM["allDomains"];
  actions: DOM["actions"][ID];
}
/**
 * Wire format for a serialized NiceActionPrimed — safe to JSON.stringify / transmit.
 */

export type INiceAction_JsonObject<
  DOM extends INiceActionDomain = INiceActionDomain,
  ID extends keyof DOM["actions"] & string = keyof DOM["actions"] & string,
> = {
  domain: DOM["domain"];
  allDomains: DOM["allDomains"];
  id: ID;
};

export type INiceActionPrimed_JsonObject<
  DOM extends INiceActionDomain = INiceActionDomain,
  ID extends keyof DOM["actions"] & string = keyof DOM["actions"] & string,
> = INiceAction_JsonObject<DOM, ID> & {
  input: TInferInputFromSchema<DOM["actions"][ID]>["SerdeInput"];
};

/**
 * Return type of `executeSafe` — a discriminated union of success and failure.
 *
 * - `{ ok: true; value: OUT }` — the action completed and returned `OUT`
 * - `{ ok: false; error: ERR }` — the action threw; `ERR` is the declared error union
 *
 * @example
 * ```ts
 * const result = await domain.action("getUser").executeSafe({ userId: "123" });
 * if (!result.ok) {
 *   result.error.handleWith([
 *     forDomain(err_auth, (h) => res.status(401).end()),
 *   ]);
 *   return;
 * }
 * console.log(result.value); // typed as the action's OUTPUT
 * ```
 */
export type NiceActionResult<OUT, ERR> = { ok: true; output: OUT } | { ok: false; error: ERR };

/**
 * Wire format for a serialized NiceActionResponse — safe to JSON.stringify / transmit.
 *
 * Carries the original action identity (domain + actionId + serialized input) alongside
 * either the serialized output value or a serialized NiceError.
 *
 * Produced by `NiceActionResponse.toJsonObject()`.
 * Reconstructed by `NiceActionDomain.hydrateResponse()`.
 */

export type INiceActionResponse_JsonObject_Success<
  DOM extends INiceActionDomain = INiceActionDomain,
  ID extends keyof DOM["actions"] & string = keyof DOM["actions"] & string,
> = INiceActionPrimed_JsonObject<DOM, ID> & {
  ok: true;
  output: TInferOutputFromSchema<DOM["actions"][ID]>["SerdeOutput"];
};

export type INiceActionResponse_JsonObject_Failure<
  DOM extends INiceActionDomain = INiceActionDomain,
  ID extends keyof DOM["actions"] & string = keyof DOM["actions"] & string,
> = INiceActionPrimed_JsonObject<DOM, ID> & {
  ok: false;
  error: INiceErrorJsonObject;
};

export type TNiceActionResponse_JsonObject<
  DOM extends INiceActionDomain = INiceActionDomain,
  ID extends keyof DOM["actions"] & string = keyof DOM["actions"] & string,
> =
  | INiceActionResponse_JsonObject_Success<DOM, ID>
  | INiceActionResponse_JsonObject_Failure<DOM, ID>;
