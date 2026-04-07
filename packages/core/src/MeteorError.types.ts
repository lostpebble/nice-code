export interface IMeteorErrorObject<
  N extends string = string,
  E extends string = string,
  C extends TErrorContextData<E> = any,
> {
  isUnknownError: boolean;
  errorIds: E[];
  context: Partial<C>;
  message: string;
  name: "MeteorError";
  extendsSubtypes: string[];
  castFromSubtype?: string;
  httpStatusCode?: number;
  originError?: Error;
  subtype: N;
}

export interface IMeteorErrorDescriptor<E extends string, C extends TErrorContextData<E>> {
  id: E;
  message: string;
  context?: E extends keyof C ? C[E] : never;
}

export type TErrorContextData<E extends string> = {
  [K in E]?: any;
};

export type TErrorContextDataCheck<E extends string> = {
  [K in E]: true;
};

export interface IErrorContextDefinition<C> {
  required?: boolean;
  type: C;
}

export type TFunctionWithContext<
  M extends IErrorIdMetadata,
  O,
  P extends object = object,
> = M["context"] extends IErrorContextDefinition<infer C>
  ? (params: P & (M["context"]["required"] extends true ? { context: C } : { context?: C })) => O
  : (params: P & { context?: never }) => O;

export interface IErrorIdMetadata<C = any> {
  context?: IErrorContextDefinition<C>;
  message?: string | TFunctionWithContext<this, string>;
  httpStatusCode?: number | TFunctionWithContext<this, number>;
}

export type TErrorContext<E extends string> = {
  [K in E]?: IErrorIdMetadata;
};

/**
 * Extracts the context value type from a single IErrorIdMetadata entry.
 * Returns `never` if there is no context definition.
 */
export type ExtractContextType<M> = M extends { context: { type: infer C } } ? C : never;

/**
 * Builds the full context data map C from a TErrorContext metadata object.
 * Uses both the raw key and its template-literal string form to handle
 * `as const` objects (which convert enum member keys to string literals).
 */
export type TContextDataFromMeta<E extends string, META extends TErrorContext<E>> = {
  [K in E]: ExtractContextType<NonNullable<META[(`${K}` | K) & keyof META]>>;
};

const errContext = {
  err1: {
    context: {
      required: true,
      type: {} as boolean,
    },
    message(params) {
      return params.context ? "Error message for true context" : "Error message for false context";
    },
  } satisfies IErrorIdMetadata<boolean>,
} as const satisfies TErrorContext<string>;
