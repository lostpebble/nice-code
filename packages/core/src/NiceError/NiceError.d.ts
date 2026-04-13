import type { NiceErrorDefined } from "../NiceErrorDefined/NiceErrorDefined";
import type { IErrorCase } from "../utils/handleWith";
import { EErrorPackType } from "../utils/packError/packError.enums";
import { type INiceErrorDefinedProps, type INiceErrorJsonObject, type IRegularErrorJsonObject, type TErrorDataForIdMap, type TErrorReconciledData, type TExtractContextType, type TNiceErrorSchema, type TUnknownNiceErrorDef } from "./NiceError.types";
import type { NiceErrorHydrated } from "./NiceErrorHydrated";
type ContextOf<S extends TNiceErrorSchema, K extends keyof S> = TExtractContextType<S[K]>;
/** Full-featured construction from NiceErrorDefined.fromId / fromContext. */
export interface INiceErrorOptions<ERR_DEF extends INiceErrorDefinedProps, ID extends keyof ERR_DEF["schema"]> {
    def: Omit<ERR_DEF, "schema">;
    /** Primary id is first entry in ids. */
    ids: ID[];
    /** All active ids with their messages, http status codes, and context state. */
    errorData: TErrorDataForIdMap<ERR_DEF["schema"]>;
    message: string;
    wasntNice?: boolean;
    httpStatusCode?: number;
    originError?: IRegularErrorJsonObject | undefined;
}
export declare class NiceError<ERR_DEF extends INiceErrorDefinedProps = TUnknownNiceErrorDef, 
/**
 * Union of active error-id keys.
 * - After `fromId(id)`: exactly one key.
 * - After `fromContext({...})`: a union of all supplied keys.
 * - After `hasOneOfIds([a,b])`: narrows to that subset.
 * - Default (bare construction / castNiceError): `TUnknownNiceErrorId`.
 */
ACTIVE_IDS extends keyof ERR_DEF["schema"] = keyof ERR_DEF["schema"]> extends Error {
    readonly name: "NiceError";
    readonly def: Omit<ERR_DEF, "schema">;
    /** Primary id is first entry in ids. */
    readonly ids: ACTIVE_IDS[];
    readonly wasntNice: boolean;
    readonly httpStatusCode: number;
    originError?: IRegularErrorJsonObject;
    _packedState?: {
        packedAs: EErrorPackType.cause_pack;
        cause: unknown;
    } | {
        packedAs: EErrorPackType.msg_pack;
        message: string;
    } | undefined;
    /** Internal: all active id → reconciled data pairs. */
    protected readonly _errorDataMap: TErrorDataForIdMap<ERR_DEF["schema"]>;
    constructor(options: INiceErrorOptions<ERR_DEF, ACTIVE_IDS>);
    /**
     * Type guard: returns `true` if this error was created with (or contains) the
     * given `id`. After the guard, `getContext(id)` will be strongly typed.
     */
    hasId<ID extends keyof ERR_DEF["schema"]>(id: ID): this is NiceError<ERR_DEF, ID>;
    /**
     * Returns `true` if this error contains **at least one** of the supplied ids.
     * Narrows `ACTIVE_IDS` to the matching subset of `IDS`.
     */
    hasOneOfIds<IDS extends ReadonlyArray<keyof ERR_DEF["schema"]>>(ids: IDS): this is NiceError<ERR_DEF, IDS[number]>;
    /** `true` when this error was created with more than one id (via `fromContext`). */
    get hasMultiple(): boolean;
    /** Returns all active error ids on this instance. */
    getIds(): Array<ACTIVE_IDS>;
    /**
     * Returns the typed context value for the given error id.
     *
     * TypeScript will only allow you to call this with an id that is part of
     * `ACTIVE_IDS` (i.e. an id confirmed via `hasId` / `hasOneOfIds`, or passed
     * to `fromId` / `fromContext`).
     *
     * @throws If the context is in the `"unhydrated"` state — the error was
     * reconstructed from a JSON payload and its context has a custom serializer
     * that hasn't been run yet. Call `niceErrorDefined.hydrate(error)` first.
     */
    getContext<ID extends ACTIVE_IDS>(id: ID): ContextOf<ERR_DEF["schema"], ID>;
    getErrorDataForId<ID extends ACTIVE_IDS>(id: ID): TErrorReconciledData<ERR_DEF["schema"], ID> | undefined;
    withOriginError(error: unknown): this;
    /**
     * Returns `true` if `other` has the same domain and the exact same set of
     * active error ids as this error (order-independent).
     *
     * Useful for deduplication, retry logic, and asserting that two errors
     * represent the same "kind" of problem without comparing context values.
     *
     * ```ts
     * const a = err_auth.fromId("invalid_credentials", { username: "alice" });
     * const b = err_auth.fromId("invalid_credentials", { username: "bob" });
     * a.matches(b); // true  — same domain + same id set
     *
     * const c = err_auth.fromId("account_locked");
     * a.matches(c); // false — same domain, different id
     * ```
     */
    matches(other: NiceError<any, any>): boolean;
    toJsonObject(): INiceErrorJsonObject<ERR_DEF>;
    hydrate(definedNiceError: NiceErrorDefined<ERR_DEF>): NiceErrorHydrated<ERR_DEF, ACTIVE_IDS>;
    /**
     * Iterates `cases` in order, finds the first whose domain matches this error
     * (via `is()`), optionally further filters by active ids, hydrates the error,
     * calls the handler, and returns `true`. Returns `false` if no case matched.
     *
     * Build cases with `forDomain` (any id in the domain) or `forIds` (specific
     * id subset). Handlers are invoked synchronously — any returned Promise is
     * not awaited. Use `handleWithAsync` when handlers are async.
     *
     * @example
     * ```ts
     * const handled = error.handleWith([
     *   forIds(err_feature, ["not_found"], (h) => {
     *     res.status(404).json({ missing: h.getContext("not_found").resource });
     *   }),
     *   forDomain(err_feature, (h) => {
     *     matchFirst(h, {
     *       forbidden: ({ userId }) => res.status(403).json({ userId }),
     *       _: () => res.status(500).end(),
     *     });
     *   }),
     *   forDomain(err_service, (h) => {
     *     res.status(h.httpStatusCode).json({ error: h.message });
     *   }),
     * ]);
     * if (!handled) next(error);
     * ```
     */
    handleWith(cases: ReadonlyArray<IErrorCase<any, any>>): boolean;
    /**
     * Same matching logic as `handleWith`, but `await`s the handler's returned
     * Promise before resolving. Use this when your handlers perform async work
     * (database writes, HTTP calls, etc.).
     *
     * @example
     * ```ts
     * const handled = await error.handleWithAsync([
     *   forDomain(err_payments, async (h) => {
     *     await db.logFailedPayment(h);
     *     await notifyOps(h.message);
     *   }),
     * ]);
     * ```
     */
    handleWithAsync(cases: ReadonlyArray<IErrorCase<any, any>>): Promise<boolean>;
    get isPacked(): boolean;
    pack(packType?: EErrorPackType): this;
    unpack(): this;
}
export {};
