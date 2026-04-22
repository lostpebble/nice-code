import type { MaybePromise } from "../../ActionDomain/NiceActionDomain.types";
import type {
  INiceAction,
  TNiceActionResponse_JsonObject,
} from "../../NiceAction/NiceAction.types";
import type { NiceActionPrimed } from "../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../NiceAction/NiceActionResponse";

/**
 * Format: `${matchTag | "_"}::${domainName | "_"}::${actionName | "_"}`
 */
export type TMatchHandlerKey = `${string}::${string}::${string}`;

export type THandleActionExecutionFn<A extends INiceAction<any, any>> = (
  primed: NiceActionPrimed<A["domain"], A["id"]>,
) => A extends INiceAction<infer DOM, infer IDS>
  ? MaybePromise<
      NiceActionResponse<DOM, IDS> | TNiceActionResponse_JsonObject<DOM, IDS> | undefined
    >
  : never;

export type THandleActionResponseFn<A extends INiceAction<any, any>> = (
  response: NiceActionResponse<A["domain"], A["id"]>,
) => A extends INiceAction<infer DOM, infer IDS>
  ? MaybePromise<
      NiceActionResponse<DOM, IDS> | TNiceActionResponse_JsonObject<DOM, IDS> | undefined
    >
  : never;

export type TExecutionAndResponseHandlers<A extends INiceAction<any, any>> =
  | {
      execution: THandleActionExecutionFn<A>;
      response?: THandleActionResponseFn<A>;
    }
  | {
      execution?: THandleActionExecutionFn<A>;
      response: THandleActionResponseFn<A>;
    }
  | {
      execution: THandleActionExecutionFn<A>;
      response: THandleActionResponseFn<A>;
    };

// export type TActionHandlerResolverFn<SCH extends NiceActionSchema<any, any, any>> = (
//   input: TInferInputFromSchema<SCH>["Input"],
// ) => MaybePromise<TInferOutputFromSchema<SCH>["Output"]>;

// export interface IActionHandlerCase {
//   readonly _matchKey: TMatchHandlerKey;
//   readonly _handler: TActionHandlerDispatchFn;
// }

export interface IActionHandlerConfig {
  /**
   * An action "match tag" for the handler.
   *
   * This can be used to specify which handler should be used for a given
   * action.
   */
  matchTag?: string;
}

export type THandleActionResult =
  | { handled: true; response: NiceActionResponse<any, any> }
  | { handled: false };
