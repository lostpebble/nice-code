import type {
  IMeteorErrorObject,
  TErrorContextData,
  TErrorContextDataCheck,
} from "./MeteorError.types";
import { zMeteorErrorObject } from "./MeteorError.zod";
import { jsErrorOrCastJsError } from "./utils/jsErrorOrCastJsError";

export class MeteorError<
    N extends string = string,
    E extends string = string,
    C extends TErrorContextData<E> = any,
  >
  extends Error
  implements IMeteorErrorObject<N, E, C>
{
  isUnknownError = false;
  public errorIds: E[] = [];
  public context: Partial<C> = {};
  public message: string;
  private setMessage: boolean = false;
  public name = "MeteorError" as const;
  public originError?: Error;
  public extendsSubtypes: string[] = [];
  public subtype: N;
  public castFromSubtype?: N;
  public httpStatusCode?: number;
  private contextCheck?: (id: E | string) => boolean;

  constructor(
    message: string,
    {
      ids,
      context,
      subtype,
      castFromSubtype,
      extendsSubtypes,
      httpStatusCode,
    }: {
      ids: E[];
      context?: Partial<C>;
      subtype?: N;
      castFromSubtype?: N;
      extendsSubtypes?: string[];
      originError: Error | undefined;
      httpStatusCode?: number;
    },
  ) {
    super(message ?? "");

    this.subtype = subtype ?? ("Unset" as N);
    this.extendsSubtypes = extendsSubtypes ?? [];
    this.castFromSubtype = castFromSubtype;
    this.httpStatusCode = httpStatusCode;

    if (subtype === "Unknown") {
      this.isUnknownError = true;
    }

    this.message = message;
    this.errorIds = ids;
    this.context = context ?? {};

    if (nullEmpty(this.message)) {
      this.message = `[${this.errorIds.join("] , [")}]`;
    }
  }

  static isMeteorErrorObj(
    err: any,
  ): err is PartialBy<IMeteorErrorObject<string, string, any>, "subtype"> {
    if (err != null && (typeof err === "object" || typeof err === "function")) {
      const parsed = zMeteorErrorObject.safeParse(err);
      return parsed.success;
    }

    return false;
  }

  static isMeteorError(err: any): err is MeteorError {
    return MeteorError.isMeteorErrorObj(err) && err instanceof MeteorError;
  }

  static cast(err: any): MeteorError {
    if (MeteorError.isMeteorErrorObj(err)) {
      return new MeteorError(err.message, {
        ids: err.errorIds,
        context: err.context,
        subtype: err.subtype ?? "Unset",
        castFromSubtype: err.castFromSubtype,
        extendsSubtypes: err.extendsSubtypes ?? [],
        originError: err.originError,
      });
    }

    throw new MeteorInternalError(
      "MeteorError: Tried to cast an object or class which does not match a MeteorError object",
    );
  }

  static castOrNull(err: any): MeteorError | null {
    try {
      return MeteorError.cast(err);
    } catch (e) {
      return null;
    }
  }

  static fromId<ID extends string>(id: ID, idContext?: any): MeteorError {
    const context = { [id]: idContext };
    return new MeteorError("", {
      ids: [id],
      context: context as any,
      subtype: "Unset",
      originError: undefined,
    });
  }

  static fromIds<ID extends string>(ids: ID[], context?: any): MeteorError {
    return new MeteorError("", {
      ids,
      context: context as any,
      subtype: "Unset",
      originError: undefined,
    });
  }

  static fromContext(context: Record<string, any>): MeteorError {
    const ids = Object.keys(context);
    return new MeteorError("", {
      ids,
      context: context as any,
      subtype: "Unset",
      originError: undefined,
    });
  }

  setContentCheck(contextCheck: TErrorContextDataCheck<StringKeyOf<C>>): void {
    this.contextCheck = (id: E | string) => contextCheck[id as unknown as StringKeyOf<C>] === true;
  }

  get idsText(): string {
    return `[${this.errorIds.join(", ")}]`;
  }

  toJsonObject(): IMeteorErrorObject<N, E, C> {
    return {
      isUnknownError: this.isUnknownError,
      errorIds: this.errorIds,
      context: this.context,
      message: this.message,
      name: this.name,
      subtype: this.subtype,
      originError: this.originError,
      castFromSubtype: this.castFromSubtype,
      extendsSubtypes: this.extendsSubtypes,
      httpStatusCode: this.httpStatusCode,
    };
  }

  hasId(errorId: E): boolean {
    return this.errorIds.includes(errorId as E);
  }

  hasOneOfIds(incomingErrorIds: E[]): boolean {
    return incomingErrorIds.some((id) => this.hasId(id));
  }

  get hasMultiple(): boolean {
    return this.errorIds.length > 1;
  }

  getIds(): E[] {
    return this.errorIds as E[];
  }

  getContextForId<K extends StringKeyOf<C> extends undefined ? never : StringKeyOf<C>>(
    id: K,
  ): C[K] {
    const context = this.context[id];

    if (context == null) {
      throw new MeteorInternalError(
        `MeteorError[${this.subtype}]: Error ID "${id as string}" context was never set. Use MeteorError.withContext() when creating the Error, or use MeteorError.fromId(id, context)`,
      );
    }

    return context;
  }

  addId<K extends E>(
    errorId: K,
    context?: K extends StringKeyOf<C> ? C[K] : never,
  ): MeteorError<N, E, C> {
    if (this.contextCheck?.(errorId) && context == null) {
      throw new MeteorInternalError(
        `MeteorError[${this.subtype}]: Error ID "${errorId}" requires context data. Provide context as second argument, or use MeteorError.withContext()`,
      );
    }

    this.errorIds = [...new Set([...this.errorIds, errorId])];

    if (context != null) {
      this.context = {
        ...this.context,
        ...context,
      };
    }

    return this;
  }

  withMessage(message: string): MeteorError<N, E, C> {
    this.message = message;
    this.setMessage = true;
    return this;
  }

  withOriginError(error: unknown): MeteorError<N, E, C> {
    this.originError = jsErrorOrCastJsError(error);

    if (!this.setMessage) {
      this.message = this.originError.message ?? this.message;
    }

    return this;
  }
}

export class MeteorInternalError extends Error {}

export type TAnyMeteorError = MeteorError<string, string, any>;

export type TMeteorErrorObject<ERR extends MeteorError> =
  ERR extends MeteorError<infer N, infer E, infer D> ? IMeteorErrorObject<N, E, D> : never;

export type TMeteorErrorInterpreter<T extends MeteorError> = (e: any) => T | undefined;

export type TMeteorErrorSubtype<O extends { _errRef: any }> =
  O["_errRef"] extends MeteorError<infer N, infer E, infer D>
    ? MeteorError<string | N, E, D>
    : never;

export type TMeteorErrorSubtypeObject<O extends { _errRef: any }> =
  O["_errRef"] extends MeteorError<infer N, infer E, infer D>
    ? IMeteorErrorObject<string | N, E, D>
    : never;

export type TMeteorResult<R, E extends MeteorError = TAnyMeteorError> =
  | {
      ok: false;
      error: E;
      result?: undefined;
    }
  | {
      ok: true;
      error?: undefined;
      result: R;
    };
