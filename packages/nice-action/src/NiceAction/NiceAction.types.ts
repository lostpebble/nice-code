import type { INiceActionDomain, TInferInputFromSchema } from "./NiceActionDomain.types";

export interface INiceAction<
  DOM extends INiceActionDomain,
  ID extends keyof DOM["schema"] & string,
> {
  id: ID;
  domain: DOM["domain"];
  allDomains: DOM["allDomains"];
  schema: DOM["schema"][ID];
}
/**
 * Wire format for a serialized NiceActionPrimed — safe to JSON.stringify / transmit.
 */

export interface INiceAction_JsonObject<
  DOM extends INiceActionDomain = INiceActionDomain,
  ID extends keyof DOM["schema"] & string = keyof DOM["schema"] & string,
> {
  domain: DOM["domain"];
  allDomains: DOM["allDomains"];
  id: ID;
}
export interface INiceActionPrimed_JsonObject<
  DOM extends INiceActionDomain = INiceActionDomain,
  ID extends keyof DOM["schema"] & string = keyof DOM["schema"] & string,
> extends INiceAction_JsonObject<DOM, ID> {
  input: TInferInputFromSchema<DOM["schema"][ID]>["SerdeInput"];
}
