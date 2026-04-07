import { NiceError } from "../NiceError/NiceError";
import type {
  ExtractContextType,
  ExtractFromIdContextArg,
  IDefineNewNiceErrorDomainOptions,
  INiceErrorDefinedProps,
  TNiceErrorSchema,
} from "../NiceError/NiceError.types";

// ---------------------------------------------------------------------------
// Helper: build the merged def type for a child domain
// ---------------------------------------------------------------------------
type ChildDef<
  PARENT_DEF extends INiceErrorDefinedProps,
  SUB extends IDefineNewNiceErrorDomainOptions,
> = {
  domain: SUB["domain"];
  allDomains: [SUB["domain"], ...PARENT_DEF["allDomains"]];
  schema: SUB["schema"];
};

// ---------------------------------------------------------------------------
// Helper: determine whether context arg is required or optional
// ---------------------------------------------------------------------------
/**
 * If the context arg for id K is `undefined` (i.e. no context defined),
 * we want `fromId(id)` to be callable with one argument.
 * Otherwise it requires the second argument.
 */
type FromIdArgs<
  ERR_DEF extends INiceErrorDefinedProps,
  K extends keyof ERR_DEF["schema"] & string,
> =
  ExtractFromIdContextArg<ERR_DEF["schema"][K]> extends undefined
    ? [id: K]
    : [id: K, context: ExtractFromIdContextArg<ERR_DEF["schema"][K]>];

// ---------------------------------------------------------------------------
// NiceErrorDefined
// ---------------------------------------------------------------------------

export class NiceErrorDefined<ERR_DEF extends INiceErrorDefinedProps> {
  readonly domain: ERR_DEF["domain"];
  readonly allDomains: ERR_DEF["allDomains"];
  /** Kept for runtime use (message resolution, httpStatusCode, etc.) */
  private readonly _schema: ERR_DEF["schema"];

  constructor(definition: ERR_DEF) {
    this.domain = definition.domain;
    this.allDomains = definition.allDomains;
    this._schema = definition.schema;
  }

  // -------------------------------------------------------------------------
  // createChildDomain
  // -------------------------------------------------------------------------

  createChildDomain<SUB extends IDefineNewNiceErrorDomainOptions>(
    subErrorDef: SUB,
  ): NiceErrorDefined<ChildDef<ERR_DEF, SUB>> {
    return new NiceErrorDefined<ChildDef<ERR_DEF, SUB>>({
      domain: subErrorDef.domain,
      allDomains: [subErrorDef.domain, ...this.allDomains] as [
        SUB["domain"],
        ...ERR_DEF["allDomains"],
      ],
      schema: subErrorDef.schema,
    } as ChildDef<ERR_DEF, SUB>);
  }

  // -------------------------------------------------------------------------
  // fromId
  // -------------------------------------------------------------------------

  /**
   * Creates a NiceError instance for the given error id.
   *
   * - `id` is constrained to keys of the schema — full autocomplete.
   * - `context` is typed per-id: required, optional, or absent based on the
   *   schema entry’s `context.required` flag.
   * - The returned NiceError carries both `ERR_DEF` and the specific `ID`,
   *   enabling `getContext(id)` to return the exact context type.
   */
  fromId<K extends keyof ERR_DEF["schema"] & string>(
    ...args: FromIdArgs<ERR_DEF, K>
  ): NiceError<ERR_DEF, K> {
    const [id, context] = args as [K, unknown];
    const entry = this._schema[id] as ERR_DEF["schema"][K];

    // Resolve message
    let message: string;
    if (typeof entry?.message === "function") {
      message = (entry.message as (ctx: unknown) => string)(context);
    } else if (typeof entry?.message === "string") {
      message = entry.message;
    } else {
      message = id;
    }

    const httpStatusCode: number =
      typeof entry?.httpStatusCode === "number" ? entry.httpStatusCode : 500;

    return new NiceError<ERR_DEF, K>({
      def: {
        domain: this.domain,
        allDomains: this.allDomains,
        schema: this._schema,
      } as unknown as ERR_DEF,
      id,
      message,
      httpStatusCode,
      context,
    });
  }
}
