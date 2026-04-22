import { castNiceError } from "@nice-code/error";
import type { NiceActionDomain } from "../../ActionDomain/NiceActionDomain";
import type {
  INiceActionDomain,
  TActionHandlerForDomain as THandlerForDomain,
  TActionIdHandlerForDomain as THandlerInputForAction,
  TActionPrimedHandlerForIds as THandlerPrimedForIds,
} from "../../ActionDomain/NiceActionDomain.types";
import { EErrId_NiceAction, err_nice_action } from "../../errors/err_nice_action";
import type {
  INiceActionPrimed_JsonObject,
  TNiceActionResponse_JsonObject,
} from "../../NiceAction/NiceAction.types";
import type { NiceActionPrimed } from "../../NiceAction/NiceActionPrimed";
import { NiceActionResponse } from "../../NiceAction/NiceActionResponse";
import type {
  IActionHandlerCase,
  IActionHandlerConfig,
  TActionHandlerDispatchFn,
  TActionHandlerDispatchResult,
  TActionHandlerResolverFn,
} from "./ActionHandler.types";

export class ActionHandler {
  readonly matchTag: string | "_";

  readonly _domains = new Map<string, NiceActionDomain<any>>();
  /**
   * High-priority resolvers (registered via `forAction` / `resolve`).
   * Always checked before `_cases`.
   */
  private _resolvers: IActionHandlerCase[] = [];
  private _cases: IActionHandlerCase[] = [];
  private _defaultHandler?: TActionHandlerDispatchFn;

  constructor(config: IActionHandlerConfig = {}) {
    this.matchTag = config.matchTag ?? "_";
  }

  /**
   * All cases (resolvers + domain/multi-action cases), for store indexing.
   */
  get cases(): readonly IActionHandlerCase[] {
    return [...this._resolvers, ...this._cases];
  }

  /**
   * Register a handler for all actions in a domain (first-match-wins among cases).
   * Receives the full primed action — use `domain.matchAction()` to narrow by id.
   * Useful for forwarding all domain actions to a remote endpoint.
   * Lower priority than `forAction`/`resolve`.
   */
  forDomain<FOR_DOM extends INiceActionDomain>(
    domain: NiceActionDomain<FOR_DOM>,
    handler: THandlerForDomain<FOR_DOM>,
  ): this {
    this._domains.set(domain.domain, domain);
    this._cases.push({
      _matchKey: `${domain.domain}::_`,
      _matcher: (primed) => primed.domain === domain.domain,
      _handler: handler as TActionHandlerDispatchFn,
    });
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
    handler: THandlerInputForAction<ACT_DOM, ID>,
  ): this {
    this._domains.set(domain.domain, domain);
    this._cases.push({
      _matchKey: `${domain.domain}::${id}`,
      _matcher: (primed) => primed.domain === domain.domain && primed.id === id,
      _handler: (primed) => (handler as (input: unknown) => unknown)(primed.input),
    });
    return this;
  }

  /**
   * Register a typed resolver for a specific action ID with highest priority —
   * always fires before any `forDomain` case regardless of registration order.
   * Receives just the typed input.
   */
  resolve<ACT_DOM extends INiceActionDomain, ID extends keyof ACT_DOM["actions"] & string>(
    domain: NiceActionDomain<ACT_DOM>,
    actionId: ID,
    fn: TActionHandlerResolverFn<ACT_DOM["actions"][ID]>,
  ): this {
    this._domains.set(domain.domain, domain);
    this._resolvers.push({
      _matchKey: `${domain.domain}::${actionId}`,
      _matcher: (primed) => primed.domain === domain.domain && primed.id === actionId,
      _handler: (primed) => (fn as (input: unknown) => unknown)(primed.input),
    });
    return this;
  }

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
    handler: THandlerPrimedForIds<ACT_DOM, IDS[number]>,
  ): this {
    this._domains.set(domain.domain, domain);
    for (const id of ids) {
      this._cases.push({
        _matchKey: `${domain.domain}::${id}`,
        _matcher: (primed) => primed.domain === domain.domain && primed.id === id,
        _handler: handler as TActionHandlerDispatchFn,
      });
    }
    return this;
  }

  /**
   * Register a fallback handler that fires when no resolver or case matches.
   * Only one default handler can be registered — calling this twice replaces
   * the previous.
   */
  setDefaultHandler(handler: TActionHandlerDispatchFn): this {
    this._defaultHandler = handler;
    return this;
  }

  /**
   * Try to dispatch a primed action. Resolvers take priority over cases.
   * Returns `{ handled: false }` if nothing matches — does not throw.
   */
  async _tryDispatch(
    primed: NiceActionPrimed<any, any, any>,
  ): Promise<TActionHandlerDispatchResult> {
    for (const r of this._resolvers) {
      if (!r._matcher(primed)) continue;
      const output = await r._handler(primed);
      return { handled: true, output };
    }

    for (const c of this._cases) {
      if (!c._matcher(primed)) continue;
      const output = await c._handler(primed);
      return { handled: true, output };
    }

    if (this._defaultHandler != null) {
      const output = await this._defaultHandler(primed);
      return { handled: true, output };
    }

    return { handled: false };
  }

  /**
   * Dispatch a primed action. Throws `domain_no_handler` if no handler matches.
   */
  async dispatchAction(primed: NiceActionPrimed<any, any, any>): Promise<unknown> {
    const result = await this._tryDispatch(primed);
    if (result.handled) return result.output;
    throw err_nice_action.fromId(EErrId_NiceAction.domain_no_handler, { domain: primed.domain });
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
  async handleWire(wire: INiceActionPrimed_JsonObject): Promise<TNiceActionResponse_JsonObject> {
    const domain = this._domains.get(wire.domain);
    if (domain == null) {
      throw err_nice_action.fromId(EErrId_NiceAction.resolver_domain_not_registered, {
        domain: wire.domain,
      });
    }

    const primed = domain.hydratePrimed(wire);

    const allCases = [...this._resolvers, ...this._cases];
    const hasCase = allCases.some((c) => c._matcher(primed));
    if (!hasCase && this._defaultHandler == null) {
      throw err_nice_action.fromId(EErrId_NiceAction.resolver_action_not_registered, {
        domain: wire.domain,
        actionId: wire.id,
      });
    }

    try {
      const validatedPrimed = await domain.validatePrimed(primed);
      const result = await this._tryDispatch(validatedPrimed);
      return validatedPrimed
        .setOutput((result as { handled: true; output: unknown }).output as any)
        .toJsonObject();
    } catch (e) {
      return new NiceActionResponse(primed, {
        ok: false,
        error: castNiceError(e),
      }).toJsonObject();
    }
  }

  /**
   * Called when this handler is registered on a domain via `domain.setHandler()`.
   * Stores the domain reference for wire-format dispatch (`handleWire`).
   */
  _onRegisteredWith(domain: NiceActionDomain<any>): void {
    this._domains.set(domain.domain, domain);
  }
}
