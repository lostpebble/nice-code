import type { INiceActionDomain } from "../../ActionDomain/NiceActionDomain.types";
import type { NiceActionPrimed } from "../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../NiceAction/NiceActionResponse";
import type { MaybePromise } from "../../utils/maybePromise";

export interface IActionConnectConfig {
  tag?: string;
  /** Default timeout for dispatching actions, in milliseconds. */
  requestTimeout?: number;
}

/** Route config for a domain or action — controls which named transport handles the dispatch. */
export interface IActionConnectRouteRequest<
  DOM extends INiceActionDomain,
  TKey extends string = string,
  ID extends keyof DOM["actions"] & string = keyof DOM["actions"] & string,
> {
  /** Send via this named transport. Omit to use the default (unnamed) transport. */
  routeKey?: TKey;
  onResponse?: (response: { [K in ID]: NiceActionResponse<DOM, K> }[ID]) => void;
  /**
   * For WebSocket or custom transports that can handle incoming requests as well.
   */
  // onIncomingRequest?: (
  //   primed: { [K in ID]: NiceActionPrimed<DOM, K> }[ID],
  // ) => MaybePromise<NiceActionResponse<DOM, ID>>;
}

/** Route config for a domain or action — controls which named transport handles the dispatch. */
export interface IActionConnectHandleIncomingRequest<
  DOM extends INiceActionDomain,
  ID extends keyof DOM["actions"] & string = keyof DOM["actions"] & string,
> {
  onActionRequest?: (
    request: { [K in ID]: NiceActionPrimed<DOM, K> }[ID],
  ) => MaybePromise<NiceActionResponse<DOM, ID>>;
  /**
   * For WebSocket or custom transports that can handle incoming requests as well.
   */
  // onIncomingRequest?: (
  //   primed: { [K in ID]: NiceActionPrimed<DOM, K> }[ID],
  // ) => MaybePromise<NiceActionResponse<DOM, ID>>;
}
