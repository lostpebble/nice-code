import type { NiceActionDomain } from "../../ActionDomain/NiceActionDomain";
import type { INiceActionDomain } from "../../ActionDomain/NiceActionDomain.types";
import { EErrId_NiceAction, err_nice_action } from "../../errors/err_nice_action";
import { EActionState } from "../../NiceAction/NiceAction.enums";
import type { INiceAction, INiceActionPrimed_JsonObject } from "../../NiceAction/NiceAction.types";
import type { NiceActionPrimed } from "../../NiceAction/NiceActionPrimed";
import { NiceActionResponse } from "../../NiceAction/NiceActionResponse";
import type {
  IActionHandlerConfig,
  TExecutionAndResponseHandlers,
  THandleActionResult,
  TMatchHandlerKey,
} from "./ActionHandler.types";

export class ActionHandler {
  readonly matchTag: string | "_";

  readonly _domains = new Map<string, NiceActionDomain<any>>();

  private _handlersByKey = new Map<TMatchHandlerKey, TExecutionAndResponseHandlers<any>>();
  private _defaultHandler?: TExecutionAndResponseHandlers<any>;

  constructor(config: IActionHandlerConfig = {}) {
    this.matchTag = config.matchTag ?? "_";
  }

  getHandlersForAction(
    action: INiceAction<any, any>,
    matchTag?: string,
  ): TExecutionAndResponseHandlers<any> | undefined {
    if (matchTag !== this.matchTag) {
      return undefined;
    }

    const matchKeysToTry: TMatchHandlerKey[] = [
      `${matchTag}::${action.domain}::${action.id}`,
      `${matchTag}::${action.domain}::_`,
    ];

    for (const key of matchKeysToTry) {
      const handlers = this._handlersByKey.get(key);
      if (handlers) {
        return handlers;
      }
    }

    return this._defaultHandler ?? undefined;
  }

  /**
   * Register a handler for all actions in a domain (first-match-wins among cases).
   * Receives the full primed action — use `domain.matchAction()` to narrow by id.
   * Useful for forwarding all domain actions to a remote endpoint.
   * Lower priority than `forAction`/`resolve`.
   */
  forDomain<FOR_DOM extends INiceActionDomain>(
    domain: NiceActionDomain<FOR_DOM>,
    handlers: TExecutionAndResponseHandlers<
      INiceAction<FOR_DOM, keyof FOR_DOM["actions"] & string>
    >,
  ): this {
    this._domains.set(domain.domain, domain);
    const matchKey: TMatchHandlerKey = `${this.matchTag}::${domain.domain}::_`;
    this._handlersByKey.set(matchKey, handlers);
    return this;
  }

  /**
   * Register a typed handler for a specific action ID (first-match-wins with `forDomain`).
   * The handler receives just the typed input. Use `resolve()` instead if you need
   * this handler to always win over any preceding `forDomain` registration.
   */
  forAction<ACT_DOM extends INiceActionDomain, ID extends keyof ACT_DOM["actions"] & string>(
    domain: NiceActionDomain<ACT_DOM>,
    id: ID,
    handlers: TExecutionAndResponseHandlers<INiceAction<ACT_DOM, ID>>,
  ): this {
    this._domains.set(domain.domain, domain);
    const matchKey: TMatchHandlerKey = `${this.matchTag}::${domain.domain}::${id}`;
    this._handlersByKey.set(matchKey, handlers);
    return this;
  }

  /**
   * Register a typed resolver for a specific action ID with highest priority —
   * always fires before any `forDomain` case regardless of registration order.
   * Receives just the typed input.
   */
  // resolve<ACT_DOM extends INiceActionDomain, ID extends keyof ACT_DOM["actions"] & string>(
  //   domain: NiceActionDomain<ACT_DOM>,
  //   actionId: ID,
  //   fn: TActionHandlerResolverFn<ACT_DOM["actions"][ID]>,
  // ): this {
  //   this._domains.set(domain.domain, domain);
  //   this._resolvers.push({
  //     _matchKey: `${domain.domain}::${actionId}`,
  //     _matcher: (primed) => primed.domain === domain.domain && primed.id === actionId,
  //     _handler: (primed) => (fn as (input: unknown) => unknown)(primed.input),
  //   });
  //   return this;
  // }

  /**
   * Register a handler for multiple action IDs (first-match-wins among cases).
   * Receives the full primed action narrowed to the union of those IDs.
   * Use `act.coreAction.id` to branch on which action was dispatched.
   */
  forActionIds<
    ACT_DOM extends INiceActionDomain,
    IDS extends ReadonlyArray<keyof ACT_DOM["actions"] & string>,
  >(
    domain: NiceActionDomain<ACT_DOM>,
    ids: IDS,
    handlers: TExecutionAndResponseHandlers<INiceAction<ACT_DOM, IDS[number]>>,
  ): this {
    this._domains.set(domain.domain, domain);
    for (const id of ids) {
      this.forAction(domain, id, handlers);
    }
    return this;
  }

  /**
   * Register a fallback handler that fires when no resolver or case matches.
   * Only one default handler can be registered — calling this twice replaces
   * the previous.
   */
  setDefaultHandler(handlers: TExecutionAndResponseHandlers<INiceAction<any, any>>): this {
    this._defaultHandler = handlers;
    return this;
  }

  private async _tryHandleResponse(
    response: NiceActionResponse<any, any>,
  ): Promise<THandleActionResult> {
    const handlers = this.getHandlersForAction(response.primed.coreAction, this.matchTag);
    if (handlers?.response) {
      const result = await handlers.response(response);
      if (result === undefined) {
        return { handled: true, response };
      }
      return {
        handled: true,
        response:
          result instanceof NiceActionResponse
            ? result
            : response.primed.coreAction.domain.hydrateResponse(result),
      };
    }
    return { handled: false };
  }

  /**
   * Try to dispatch a primed action. Resolvers take priority over cases.
   * Returns `{ handled: false }` if nothing matches — does not throw.
   */
  private async _tryExecute(primed: NiceActionPrimed<any, any, any>): Promise<THandleActionResult> {
    // if (response == null) {
    //   return primed.setResponse(undefined);
    // }

    // return response instanceof NiceActionResponse ? response : domain.hydrateResponse(response);
    // for (const r of this._resolvers) {
    //   if (!r._matcher(primed)) continue;
    //   const output = await r._handler(primed);
    //   return { handled: true, output };
    // }

    // for (const c of this._cases) {
    //   if (!c._matcher(primed)) continue;
    //   const output = await c._handler(primed);
    //   return { handled: true, output };
    // }

    // if (this._defaultHandler != null) {
    //   const output = await this._defaultHandler(primed);
    //   return { handled: true, output };
    // }

    return { handled: false };
  }

  /**
   * Dispatch a primed action. Throws `domain_no_handler` if no handler matches.
   */
  async dispatchAction(primed: NiceActionPrimed<any, any>): Promise<NiceActionResponse<any, any>> {
    const result = await this._tryExecute(primed);
    if (result.handled) return result.response;
    throw err_nice_action.fromId(EErrId_NiceAction.no_action_execution_handler, {
      domain: primed.domain,
      actionId: primed.id,
    });
  }

  /**
   * Dispatch a wire-format primed action and return a wire-format response.
   * Used for server-side HTTP/WebSocket handlers — catches resolver errors and
   * serializes them into the response (`ok: false`) rather than propagating.
   *
   * Throws (does not wrap) for structural errors:
   * - `resolver_domain_not_registered` — domain not known to this handler
   * - `hydration_*` — the wire payload is malformed
   * - `resolver_action_not_registered` — no case for this action id
   *
   * @example
   * ```ts
   * app.post("/actions", async (req, res) => {
   *   const response = await handler.handleWire(req.body);
   *   res.json(response);
   * });
   * ```
   */
  async handleWire(wire: INiceActionPrimed_JsonObject): Promise<NiceActionResponse<any, any>> {
    const domain = this._domains.get(wire.domain);
    if (domain == null) {
      throw err_nice_action.fromId(EErrId_NiceAction.domain_no_handler, {
        domain: wire.domain,
      });
    }

    if (wire.type === EActionState.primed) {
      // For primed actions, we can validate the input before dispatching to save wasted handler execution.
      const primed = domain.hydratePrimed(wire);
      // const handlers = this.getHandlersForAction(primed.coreAction, this.matchTag);

      // if (handlers == null || handlers.execution == null) {
      //   throw err_nice_action.fromId(EErrId_NiceAction.no_action_execution_handler, {
      //     domain: wire.domain,
      //     actionId: wire.id,
      //   });
      // }

      return await this.dispatchAction(primed);
    }

    if (wire.type === EActionState.resolved) {
      // For resolved actions, we have to skip straight to dispatch since we don't have the input to validate.
      const primed = domain.hydratePrimed(wire);
      const handlers = this.getHandlersForAction(primed.coreAction, this.matchTag);

      if (handlers == null || handlers.response == null) {
        throw err_nice_action.fromId(EErrId_NiceAction.no_action_response_handler, {
          domain: wire.domain,
          actionId: wire.id,
        });
      }
    }

    throw err_nice_action.fromId(EErrId_NiceAction.handle_wire_not_primed_or_response, {
      domain: wire.domain,
      actionId: wire.id,
      actionState: wire.type,
    });

    // const allCases = [...this._resolvers, ...this._cases];
    // const hasCase = allCases.some((c) => c._matcher(primed));
    // if (!hasCase && this._defaultHandler == null) {
    //   throw err_nice_action.fromId(EErrId_NiceAction.no_action_execution_handler, {
    //     domain: wire.domain,
    //     actionId: wire.id,
    //   });
    // }

    // try {
    //   const validatedPrimed = await domain.validatePrimed(primed);
    //   const result = await this._tryExecute(validatedPrimed);
    //   return validatedPrimed
    //     .setOutput((result as { handled: true; output: unknown }).output as any)
    //     .toJsonObject();
    // } catch (e) {
    //   return new NiceActionResponse(primed, {
    //     ok: false,
    //     error: castNiceError(e),
    //   }).toJsonObject();
    // }
  }

  /**
   * Called when this handler is registered on a domain via `domain.setHandler()`.
   * Stores the domain reference for wire-format dispatch (`handleWire`).
   */
  _onRegisteredWith(domain: NiceActionDomain<any>): void {
    this._domains.set(domain.domain, domain);
  }
}
