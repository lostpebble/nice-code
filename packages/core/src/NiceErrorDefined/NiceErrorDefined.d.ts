import { NiceError } from "../NiceError/NiceError";
import { type FromIdArgs, type IDefineNewNiceErrorDomainOptions, type INiceErrorDefinedProps, type TErrorReconciledData, type TFromContextInput } from "../NiceError/NiceError.types";
import { NiceErrorHydrated } from "../NiceError/NiceErrorHydrated";
import { type EErrorPackType } from "../utils/packError/packError.enums";
type ChildDef<PARENT_DEF extends INiceErrorDefinedProps, SUB extends IDefineNewNiceErrorDomainOptions> = {
    domain: SUB["domain"];
    allDomains: [SUB["domain"], ...PARENT_DEF["allDomains"]];
    schema: SUB["schema"];
};
/**
 * Extracts the union of keys present in a `TFromContextInput` object.
 * e.g. `{ invalid_credentials: {...} }` → `"invalid_credentials"`
 */
type KeysOfContextInput<INPUT> = keyof INPUT & string;
/**
 * Infers the strongly-typed `NiceError` class type from a `NiceErrorDefined` instance.
 *
 * `ACTIVE_IDS` is set to the full union of all schema keys. Use `hasId` /
 * `hasOneOfIds` to narrow further at the call site.
 *
 * @example
 * ```ts
 * const err_user_auth = defineNiceError({ domain: "err_user_auth", schema: { ... } });
 * type TUserAuthError = InferNiceError<typeof err_user_auth>;
 * // → NiceError<{ domain: "err_user_auth"; ... }, keyof schema>
 * ```
 */
export type InferNiceError<T extends NiceErrorDefined<any>> = T extends NiceErrorDefined<infer ERR_DEF> ? NiceError<ERR_DEF, keyof ERR_DEF["schema"]> : never;
/**
 * Infers the strongly-typed `NiceErrorHydrated` class type from a `NiceErrorDefined` instance.
 *
 * Use this when you need the builder methods (`addId`, `addContext`) as part of
 * the inferred type — e.g. for function return types or variable annotations.
 *
 * @example
 * ```ts
 * const err_user_auth = defineNiceError({ domain: "err_user_auth", schema: { ... } });
 * type TUserAuthErrorHydrated = InferNiceErrorHydrated<typeof err_user_auth>;
 * // → NiceErrorHydrated<{ domain: "err_user_auth"; ... }, keyof schema>
 * ```
 */
export type InferNiceErrorHydrated<T extends NiceErrorDefined<any>> = T extends NiceErrorDefined<infer ERR_DEF> ? NiceErrorHydrated<ERR_DEF, keyof ERR_DEF["schema"]> : never;
export declare class NiceErrorDefined<ERR_DEF extends INiceErrorDefinedProps> {
    readonly domain: ERR_DEF["domain"];
    readonly allDomains: ERR_DEF["allDomains"];
    readonly defaultHttpStatusCode?: number;
    readonly defaultMessage?: string;
    /** Kept for runtime use (message resolution, httpStatusCode, context serialization, etc.). */
    private readonly _schema;
    private _definedChildNiceErrors;
    private _definedParentNiceError?;
    /** Set by `.packAs()` — explicit per-instance override, takes priority over `_packAsFn`. */
    private _setPack?;
    /** Set at definition time — called dynamically each time an error is created. */
    private _packAsFn?;
    constructor(definition: ERR_DEF);
    /**
     * Creates a child domain that inherits this domain in `allDomains`.
     * The child has its own schema and its own domain string.
     */
    createChildDomain<SUB extends IDefineNewNiceErrorDomainOptions>(subErrorDef: SUB): NiceErrorDefined<ChildDef<ERR_DEF, SUB>>;
    protected addParentNiceErrorDefined<PARENT_DEF extends INiceErrorDefinedProps>(parentError: NiceErrorDefined<PARENT_DEF>): void;
    protected addChildNiceErrorDefined<CHILD_DEF extends INiceErrorDefinedProps>(child: NiceErrorDefined<CHILD_DEF>): void;
    packAs(pack: EErrorPackType): this;
    private createError;
    /**
     * Promotes a plain `NiceError<ERR_DEF>` back into a `NiceErrorHydrated` so
     * that builder methods (`addId`, `addContext`, etc.) are available again.
     *
     * For each active id, if the context is in the `"unhydrated"` state (i.e. the
     * error was reconstructed from a JSON payload), `hydrate` calls
     * `fromJsonSerializable` to reconstruct the typed value and advances the state
     * to `"hydrated"`. Ids already in `"hydrated"` or `"raw_unset"` state
     * are passed through unchanged.
     *
     * @throws If `error.def.domain` does not match this definition's domain. Use
     * `niceErrorDefined.is(error)` before calling `hydrate` to ensure compatibility.
     *
     * ```ts
     * const raw = castNiceError(apiResponseBody);
     *
     * if (err_user_auth.is(raw)) {
     *   const hydrated = err_user_auth.hydrate(raw);
     *   // hydrated.getContext("invalid_credentials") — fully typed, no throw
     *   // hydrated.addId / addContext — available again
     * }
     * ```
     */
    hydrate<ACTIVE_IDS extends keyof ERR_DEF["schema"]>(error: NiceError<ERR_DEF, ACTIVE_IDS>): NiceErrorHydrated<ERR_DEF, ACTIVE_IDS>;
    /**
     * Creates a `NiceErrorHydrated` for a single error id.
     *
     * - `id` autocompletes to the schema keys.
     * - The second argument `context` is required / optional / absent based on
     *   whether the schema entry declares `context.required: true`.
     * - The returned error has `ACTIVE_IDS` narrowed to exactly `K`, so
     *   `getContext(id)` is immediately strongly typed.
     */
    fromId<K extends keyof ERR_DEF["schema"] & string>(...args: FromIdArgs<ERR_DEF, K>): NiceErrorHydrated<ERR_DEF, K>;
    fromContext<INPUT extends TFromContextInput<ERR_DEF["schema"]>>(context: INPUT & Record<Exclude<keyof INPUT, keyof ERR_DEF["schema"]>, never>): NiceErrorHydrated<ERR_DEF, KeysOfContextInput<INPUT>>;
    /**
     * Returns `true` if `error` is a `NiceError` whose `def.domain` exactly matches
     * this definition's domain.
     *
     * Use this after `castNiceError` to narrow an unknown error to this specific
     * domain before accessing its typed ids/context:
     *
     * ```ts
     * const caught = castNiceError(e);
     *
     * if (err_user_auth.is(caught)) {
     *   // caught is now NiceError<typeof err_user_auth's ERR_DEF>
     *   const hydrated = err_user_auth.hydrate(caught);
     *   const { username } = hydrated.getContext("invalid_credentials");
     * }
     * ```
     */
    is(error: unknown): error is NiceError<ERR_DEF, keyof ERR_DEF["schema"]>;
    /**
     * Returns `true` if this domain appears anywhere in the target's ancestry
     * chain (including an exact domain match).
     *
     * Accepts either a `NiceErrorDefined` (domain definition) or a `NiceError`
     * instance (extracts the domain from its `def`).
     */
    isParentOf(target: NiceErrorDefined<any> | NiceError<any, any>): boolean;
    private _buildDef;
    private _resolveMessage;
    private _resolveHttpStatusCode;
    reconcileErrorDataForId(id: keyof ERR_DEF["schema"] & string, context: TFromContextInput<ERR_DEF["schema"]>[typeof id]): TErrorReconciledData<ERR_DEF["schema"], typeof id>;
}
export {};
