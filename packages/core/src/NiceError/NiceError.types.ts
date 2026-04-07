export interface IRegularErrorJsonObject {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
}

// ---------------------------------------------------------------------------
// Schema entry types
// ---------------------------------------------------------------------------

/** Describes the context attached to a single error id. */
export interface INiceErrorContextDefinition<C = unknown> {
  required?: boolean;
  type: C;
}

/**
 * A single entry in a NiceErrorDefined schema.
 * `C` is the context value type (defaults to `never` = no context).
 */
export interface INiceErrorIdMetadata<C = never> {
  context?: INiceErrorContextDefinition<C>;
  /** Static message string OR a function that receives the context value and returns a string. */
  message?: [C] extends [never] ? string : string | ((context: C) => string);
  httpStatusCode?: number;
}

// ---------------------------------------------------------------------------
// Schema map type
// ---------------------------------------------------------------------------

/** A record mapping error-id string keys to their metadata. */
export type TNiceErrorSchema = Record<string, INiceErrorIdMetadata<any>>;

// ---------------------------------------------------------------------------
// Helpers to extract context from a schema entry
// ---------------------------------------------------------------------------

/** Extracts the raw context value type `C` from a single schema entry. */
export type ExtractContextType<M> = M extends { context: { type: infer C } } ? C : never;

/**
 * Given a schema entry M, returns the context argument type expected by `fromId`:
 * - If the entry has `context.required: true` → `C` (required, pass directly)
 * - If the entry has a context definition but not required → `C | undefined`
 * - If no context → `undefined`
 */
export type ExtractFromIdContextArg<M> =
  M extends { context: { required: true; type: infer C } }
    ? C
    : M extends { context: { type: infer C } }
      ? C | undefined
      : undefined;

// ---------------------------------------------------------------------------
// Defined-error props (carried on NiceErrorDefined)
// ---------------------------------------------------------------------------

export interface IDefineNewNiceErrorDomainOptions<
  ERR_DOMAIN extends string = string,
  SCHEMA extends TNiceErrorSchema = TNiceErrorSchema,
> {
  domain: ERR_DOMAIN;
  schema: SCHEMA;
}

export interface INiceErrorDefinedProps<
  ERR_DOMAINS extends string[] = string[],
  SCHEMA extends TNiceErrorSchema = TNiceErrorSchema,
> {
  domain: ERR_DOMAINS[number];
  allDomains: ERR_DOMAINS;
  schema: SCHEMA;
}

// ---------------------------------------------------------------------------
// NiceError instance shape
// ---------------------------------------------------------------------------

export interface INiceErrorJsonObject<
  ERR_DEF extends INiceErrorDefinedProps = INiceErrorDefinedProps,
> {
  name: "NiceError";
  def: ERR_DEF;
  wasntNice: boolean;
  message: string;
  httpStatusCode: number;
  originError?: IRegularErrorJsonObject;
}
