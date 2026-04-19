import type { NiceError } from "../NiceError/NiceError";
import type { INiceErrorDefinedProps } from "../NiceError/NiceError.types";
import type { NiceErrorHydrated } from "../NiceError/NiceErrorHydrated";
import type { NiceErrorDefined } from "../NiceErrorDefined/NiceErrorDefined";
import type { IErrorCase } from "../utils/handleWith";
import type { TBroadErrorHandler } from "./NiceErrorHandler.types";

export class NiceErrorHandler {
  private cases: IErrorCase<INiceErrorDefinedProps, any>[] = [];
  private _defaultRequester?: TBroadErrorHandler<NiceError>;

  async handleError(action: NiceError): Promise<unknown> {
    for (const errorCase of this.cases) {
      if (!errorCase._matcher(action)) continue;
      return await errorCase._requester(action);
    }

    if (this._defaultRequester) {
      return await this._defaultRequester(action);
    }

    throw new Error(
      `No handler found for action "${action.coreAction.id}" in domain "${action.coreAction.domain}"`,
    );
  }

  /**
   * Register a handler that fires for **any** action whose domain matches `domain`.
   * `act.input` is typed as the union of input types for all actions in `domain`.
   * First matching case wins.
   */
  forDomain<DEF extends INiceErrorDefinedProps>(
    domain: NiceErrorDefined<DEF>,
    handler: (error: NiceErrorHydrated<DEF, keyof DEF["schema"] & string>) => void | Promise<void>,
  ): IErrorCase<DEF, keyof DEF["schema"] & string> {
    return { _domain: domain, _ids: undefined, _handler: handler };
  }

  /**
   * Register a handler that fires only for the specific action `id`.
   * The handler's `action.input` is narrowed to the schema for that ID.
   * First matching case wins.
   */
  forActionId<ACT_DOM extends INiceActionDomain, ID extends keyof ACT_DOM["actions"] & string>(
    domain: NiceActionDomain<ACT_DOM>,
    id: ID,
    handler: TActionIdHandlerForDomain<ACT_DOM, ID>,
  ): this {
    this.cases.push({
      _matcher: (action) => domain.isExactActionDomain(action) && action.coreAction.id === id,
      _requester: handler as unknown as TBroadActionRequester<NiceActionPrimed<any, any, any>>,
    });
    return this;
  }

  /**
   * Register a handler that fires for any action whose id is in `ids`.
   * The handler's `action.input` is narrowed to the union of those IDs' schemas.
   * First matching case wins.
   */
  forActionIds<
    ACT_DOM extends INiceActionDomain,
    IDS extends ReadonlyArray<keyof ACT_DOM["actions"] & string>,
  >(
    domain: NiceActionDomain<ACT_DOM>,
    ids: IDS,
    handler: TActionIdHandlerForDomain<ACT_DOM, IDS[number]>,
  ): this {
    this.cases.push({
      _matcher: (action) =>
        domain.isExactActionDomain(action) &&
        (ids as readonly string[]).includes(action.coreAction.id),
      _requester: handler as unknown as TBroadActionRequester<NiceActionPrimed<any, any, any>>,
    });
    return this;
  }

  /**
   * Register a fallback handler that fires when no other case matches.
   * Only one default handler can be registered — calling this twice replaces the previous one.
   */
  setDefaultHandler(handler: TBroadActionRequester<NiceActionPrimed<any, any, any>>): this {
    this._defaultRequester = handler;
    return this;
  }
}
