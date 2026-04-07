import { MeteorError, MeteorInternalError } from "../MeteorError";
import type {
  IMeteorErrorDescriptor,
  IMeteorErrorObject,
  TContextDataFromMeta,
  TErrorContext,
  TErrorContextData,
} from "../MeteorError.types";
import { getAllMeteorErrorSubtypes } from "../utils/getAllMeteorErrorSubtypes";

/**
 * Describes the full API surface returned by createMeteorErrorSubtype.
 * C defaults to TContextDataFromMeta<E, META> so TypeScript evaluates it
 * with the actual inferred META type at each call site.
 */
export type TSubtypeFactory<
  N extends string,
  E extends string,
  META extends TErrorContext<E>,
  C extends TErrorContextData<E> = TContextDataFromMeta<E, META>,
> = {
  fromId<ID extends E>(id: ID, idContext?: C[ID]): MeteorError<N, E, C>;
  fromIds<ID extends E>(ids: ID[], context?: Partial<C>): MeteorError<N, E, C>;
  fromContext(context: Partial<C>): MeteorError<N, E, C>;
  fromDescriptor(descriptor: IMeteorErrorDescriptor<E, C>): MeteorError<N, E, C>;
  cast(inspectError?: any): MeteorError<N, E, C>;
  castOrNull(err: any): MeteorError<N, E, C> | null;
  is(err: any): err is MeteorError<N, E, C>;
  isExactSubtype(err: any): err is MeteorError<N, E, C>;
  isObj(inspectErr: unknown): inspectErr is IMeteorErrorObject<N, E, C>;
  isExactSubtypeObj(err: unknown): err is IMeteorErrorObject<N, E, C>;
  extendMeteorErrorSubtype<
    SN extends string,
    SE extends string,
    SMETA extends TErrorContext<SE> = {},
  >(sName: SN, sMeta?: SMETA): TSubtypeFactory<SN, SE | E, SMETA & META>;
  _errRef: MeteorError<N, E, C>;
};

export function createMeteorErrorSubtype<
  N extends string,
  E extends string = never,
  META extends TErrorContext<E> = {},
>(subtype: N, errorMeta?: META, extendsSubtypes?: string[]): TSubtypeFactory<N, E, META> {
  // Internal context type — used at runtime via `any`; the public API types are
  // defined through TSubtypeFactory which evaluates C correctly at each call site.
  type C = any;

  const errorBaseData = {
    errorMeta,
    subtype,
    extendsSubtypes: extendsSubtypes ?? [],
  };

  const isContextRequired = (id: string): boolean => {
    const meta = (errorMeta as Record<string, any> | undefined)?.[id];
    return meta?.context?.required === true;
  };

  const computeMessage = (id: string, contextValue: unknown): string => {
    const meta = (errorMeta as Record<string, any> | undefined)?.[id];
    if (meta == null) return "";
    if (typeof meta.message === "function") {
      return meta.message({ context: contextValue });
    }
    return meta.message ?? "";
  };

  const computeHttpStatus = (id: string, contextValue: unknown): number | undefined => {
    const meta = (errorMeta as Record<string, any> | undefined)?.[id];
    if (meta == null) return undefined;
    if (typeof meta.httpStatusCode === "function") {
      return meta.httpStatusCode({ context: contextValue });
    }
    return meta.httpStatusCode;
  };

  const contextCheckThrow = (ids: E[], context?: Partial<C>) => {
    for (const id of ids) {
      if (isContextRequired(id) && (context == null || context[id] == null)) {
        throw new MeteorInternalError(
          `MeteorError [subtype: ${subtype}]: Error ID "${id}" requires context data. Provide context with the IDs when creating the Error, or use MeteorError.withContext()`,
        );
      }
    }
  };

  const wrapWithContextCheck = (error: MeteorError<N, E, C>): MeteorError<N, E, C> => {
    if (errorMeta != null) {
      const check: Record<string, true> = {};
      for (const id of Object.keys(errorMeta)) {
        if (isContextRequired(id)) {
          check[id] = true;
        }
      }
      if (Object.keys(check).length > 0) {
        error.setContentCheck(check as any);
      }
    }
    return error;
  };

  const isObj = (inspectErr: unknown): inspectErr is IMeteorErrorObject<N, E, C> => {
    if (!MeteorError.isMeteorErrorObj(inspectErr)) {
      return false;
    }
    if (inspectErr.subtype == null) {
      return false;
    }
    return inspectErr.subtype === subtype || (extendsSubtypes ?? []).includes(inspectErr.subtype);
  };

  const isExactSubtypeObj = (err: unknown): err is IMeteorErrorObject<N, E, C> => {
    return MeteorError.isMeteorErrorObj(err) && err.subtype === subtype;
  };

  const is = (err: any): err is MeteorError<N, E, C> => {
    return isObj(err) && err instanceof MeteorError;
  };

  const isExactSubtype = (err: any): err is MeteorError<N, E, C> => {
    return isExactSubtypeObj(err) && err instanceof MeteorError;
  };

  const cast = (inspectError?: any): MeteorError<N, E, C> => {
    if (isObj(inspectError)) {
      return new MeteorError(inspectError.message, {
        ids: inspectError.errorIds,
        context: inspectError.context,
        subtype,
        castFromSubtype: inspectError.subtype,
        extendsSubtypes,
        originError: inspectError.originError,
        httpStatusCode: inspectError.httpStatusCode,
      });
    }
    throw new MeteorInternalError(
      `MeteorError [subtypes: "${getAllMeteorErrorSubtypes(errorBaseData).join(`", "`)}"]: Tried to cast an object or class which does not match a MeteorError object or this subtype [incoming error subtypes: "${getAllMeteorErrorSubtypes(inspectError).join(`", "`)}"]`,
    );
  };

  const castOrNull = (err: any): MeteorError<N, E, C> | null => {
    try {
      return cast(err);
    } catch (e) {
      if (e instanceof Error) {
        console.warn(e.message);
      }
      return null;
    }
  };

  const fromId = (id: E, idContext?: any) => {
    const context = { [id]: idContext } as Partial<C>;
    contextCheckThrow([id], context);
    const message = computeMessage(id, idContext);
    const httpStatusCode = computeHttpStatus(id, idContext);
    return wrapWithContextCheck(
      new MeteorError<N, E, C>(message, {
        ids: [id],
        context,
        subtype,
        extendsSubtypes,
        originError: undefined,
        httpStatusCode,
      }),
    );
  };

  const fromIds = (ids: E[], context?: Partial<C>) => {
    contextCheckThrow(ids, context);
    const message = ids.reduce<string>((acc, id) => {
      if (acc) return acc;
      return computeMessage(id, (context as any)?.[id]) || acc;
    }, "");
    const httpStatusCode = ids.reduce<number | undefined>((acc, id) => {
      const code = computeHttpStatus(id, (context as any)?.[id]);
      if (code == null) return acc;
      return acc == null ? code : Math.max(acc, code);
    }, undefined);
    return wrapWithContextCheck(
      new MeteorError<N, E, C>(message, {
        ids,
        context,
        subtype,
        extendsSubtypes,
        originError: undefined,
        httpStatusCode,
      }),
    );
  };

  const fromContext = (context: Partial<C>) => {
    const ids = Object.keys(context) as E[];
    return fromIds(ids, context);
  };

  const fromDescriptor = (descriptor: IMeteorErrorDescriptor<E, C>) => {
    contextCheckThrow([descriptor.id], {
      [descriptor.id]: descriptor.context,
    } as any);
    const message = descriptor.message || computeMessage(descriptor.id, descriptor.context);
    const httpStatusCode = computeHttpStatus(descriptor.id, descriptor.context);
    return wrapWithContextCheck(
      new MeteorError<N, E, C>(message, {
        ids: [descriptor.id],
        context: { [descriptor.id]: descriptor.context } as Partial<C>,
        subtype,
        extendsSubtypes,
        originError: undefined,
        httpStatusCode,
      }),
    );
  };

  const extendMeteorErrorSubtype = <
    SN extends string,
    SE extends string,
    SMETA extends TErrorContext<SE> = {},
  >(
    sName: SN,
    sMeta?: SMETA,
  ) => {
    return createMeteorErrorSubtype<SN, SE | E, SMETA & META>(
      sName,
      { ...(sMeta ?? {}), ...(errorMeta ?? {}) } as any,
      [...(extendsSubtypes ?? []), subtype],
    );
  };

  const _errRef = wrapWithContextCheck(
    new MeteorError<N, E, C>("", {
      ids: [],
      context: {},
      subtype,
      extendsSubtypes,
      originError: undefined,
    }),
  );

  return {
    is,
    isExactSubtype,
    isObj,
    isExactSubtypeObj,
    fromId,
    fromIds,
    fromContext,
    fromDescriptor,
    cast,
    castOrNull,
    extendMeteorErrorSubtype,
    _errRef,
  } as unknown as TSubtypeFactory<N, E, META>;
}
