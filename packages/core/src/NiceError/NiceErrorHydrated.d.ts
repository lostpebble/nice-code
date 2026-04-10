import type { NiceErrorDefined } from "../NiceErrorDefined/NiceErrorDefined";
import { type INiceErrorOptions, NiceError } from "./NiceError";
import type { ExtractFromIdContextArg, INiceErrorDefinedProps, TFromContextInput, TUnknownNiceErrorDef } from "./NiceError.types";
/**
 * Resolves the args tuple for `addId` — mirrors `FromIdArgs` exactly so that
 * optional vs required context is consistent across both `fromId` and `addId`.
 *
 * - No context on this id                   → `[id]`
 * - Context defined, `required: true`       → `[id, context]`
 * - Context defined, `required` absent/false → `[id] | [id, context]`
 */
type AddIdArgs<ERR_DEF extends INiceErrorDefinedProps, K extends keyof ERR_DEF["schema"] & string> = [ExtractFromIdContextArg<ERR_DEF["schema"][K]>] extends [undefined] ? [id: K] : [undefined] extends [ExtractFromIdContextArg<ERR_DEF["schema"][K]>] ? [id: K] | [id: K, context: NonNullable<ExtractFromIdContextArg<ERR_DEF["schema"][K]>>] : [id: K, context: ExtractFromIdContextArg<ERR_DEF["schema"][K]>];
/** Full-featured construction from NiceErrorDefined.fromId / fromContext. */
export interface INiceErrorHydratedOptions<ERR_DEF extends INiceErrorDefinedProps, ID extends keyof ERR_DEF["schema"]> extends INiceErrorOptions<ERR_DEF, ID> {
    def: ERR_DEF;
    niceErrorDefined: NiceErrorDefined<ERR_DEF>;
}
export declare class NiceErrorHydrated<ERR_DEF extends INiceErrorDefinedProps = TUnknownNiceErrorDef, 
/**
 * Union of active error-id keys.
 * - After `fromId(id)`: exactly one key.
 * - After `fromContext({...})`: a union of all supplied keys.
 * - After `hasOneOfIds([a,b])`: narrows to that subset.
 * - Default (bare construction / castNiceError): `TUnknownNiceErrorId`.
 */
ACTIVE_IDS extends keyof ERR_DEF["schema"] = keyof ERR_DEF["schema"]> extends NiceError<ERR_DEF, ACTIVE_IDS> {
    readonly def: ERR_DEF;
    private readonly niceErrorDefined;
    constructor(options: INiceErrorHydratedOptions<ERR_DEF, ACTIVE_IDS>);
    /**
     * Returns a **new** `NiceErrorHydrated` with additional id+context entries merged in.
     * The returned error's `ACTIVE_IDS` is the union of the original ids and the
     * newly supplied keys.
     *
     * ```ts
     * const err = errDef.fromId("id_a", { a: 1 })
     *   .addContext({ id_b: { b: "x" } });
     * err.getIds(); // ["id_a", "id_b"]
     * ```
     */
    addContext<INPUT extends TFromContextInput<ERR_DEF["schema"]>>(context: INPUT & Record<Exclude<keyof INPUT, keyof ERR_DEF["schema"] & string>, never>): NiceErrorHydrated<ERR_DEF, ACTIVE_IDS | (keyof INPUT & string)>;
    /**
     * Returns a **new** `NiceErrorHydrated` with an additional error id (and its context,
     * if the schema requires one). Equivalent to `addContext({ [id]: context })`
     * but mirrors the `fromId` ergonomics for single-id additions.
     */
    addId<K extends keyof ERR_DEF["schema"] & string>(...args: AddIdArgs<ERR_DEF, K>): NiceErrorHydrated<ERR_DEF, ACTIVE_IDS | K>;
}
export {};
