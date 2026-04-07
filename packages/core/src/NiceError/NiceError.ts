import type {
  ExtractContextType,
  INiceErrorDefinedProps,
  INiceErrorJsonObject,
  IRegularErrorJsonObject,
  TNiceErrorSchema,
} from "./NiceError.types";

// ---------------------------------------------------------------------------
// Helper: given a schema S and an id K, extract the context type
// ---------------------------------------------------------------------------
type ContextOf<S extends TNiceErrorSchema, K extends keyof S> = ExtractContextType<S[K]>;

// ---------------------------------------------------------------------------
// NiceError
// ---------------------------------------------------------------------------

export class NiceError<
  ERR_DEF extends INiceErrorDefinedProps = INiceErrorDefinedProps,
  /** Tracks which error-id this instance was created from (narrows after hasId). */
  CURRENT_ID extends keyof ERR_DEF["schema"] = keyof ERR_DEF["schema"],
> extends Error {
  override readonly name = "NiceError" as const;

  readonly def: ERR_DEF;
  readonly id: CURRENT_ID;
  readonly wasntNice: boolean;
  readonly httpStatusCode: number;
  readonly originError?: Error;

  /**
   * Raw context storage. Typed as `unknown` here; strongly-typed access is
   * provided through `getContext(id)`.
   */
  private readonly _context: unknown;

  constructor(options: {
    def: ERR_DEF;
    id: CURRENT_ID;
    message: string;
    wasntNice?: boolean;
    httpStatusCode?: number;
    context?: unknown;
    originError?: Error;
  }) {
    super(options.message);
    this.def = options.def;
    this.id = options.id;
    this.wasntNice = options.wasntNice ?? false;
    this.httpStatusCode = options.httpStatusCode ?? 500;
    this._context = options.context;
    this.originError = options.originError;
  }

  // -------------------------------------------------------------------------
  // hasId — narrows this instance to a NiceError with CURRENT_ID = ID
  // -------------------------------------------------------------------------

  hasId<ID extends keyof ERR_DEF["schema"]>(
    id: ID,
  ): this is NiceError<ERR_DEF, ID> {
    return (this.id as string) === (id as string);
  }

  // -------------------------------------------------------------------------
  // getContext — returns the strongly-typed context for a given id
  // -------------------------------------------------------------------------

  /**
   * Returns the context value for this error.
   * Calling `hasId(id)` before this call narrows the return type automatically
   * via the `CURRENT_ID` type parameter, so you usually just call
   * `getContext(id)` after the `hasId` guard.
   */
  getContext<ID extends CURRENT_ID>(
    _id: ID,
  ): ContextOf<ERR_DEF["schema"], ID> {
    return this._context as ContextOf<ERR_DEF["schema"], ID>;
  }

  // -------------------------------------------------------------------------
  // toJsonObject
  // -------------------------------------------------------------------------

  toJsonObject(): INiceErrorJsonObject<ERR_DEF> {
    const originError: IRegularErrorJsonObject | undefined = this.originError
      ? {
          name: this.originError.name,
          message: this.originError.message,
          stack: this.originError.stack,
          cause: this.originError.cause,
        }
      : undefined;

    return {
      name: "NiceError",
      def: this.def,
      wasntNice: this.wasntNice,
      message: this.message,
      httpStatusCode: this.httpStatusCode,
      originError,
    };
  }
}
