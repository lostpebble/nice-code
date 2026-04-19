import type { INiceErrorDomainProps, TDomainNiceErrorId } from "../NiceError/NiceError.types";
import type { NiceErrorHydrated } from "../NiceError/NiceErrorHydrated";
import type { NiceErrorDomain } from "../NiceErrorDefined/NiceErrorDefined";
import { NiceErrorHandler } from "./NiceErrorHandler";
import type { MaybePromise } from "./NiceErrorHandler.types";

export function forDomain<DEF extends INiceErrorDomainProps, H_RES = void>(
  domain: NiceErrorDomain<DEF>,
  handler: (error: NiceErrorHydrated<DEF, TDomainNiceErrorId<DEF>>) => MaybePromise<H_RES>,
): NiceErrorHandler<never, H_RES> {
  return new NiceErrorHandler<never, never>().forDomain(domain, handler);
}

export function forId<
  DEF extends INiceErrorDomainProps,
  ID extends TDomainNiceErrorId<DEF>,
  H_RES = void,
>(
  domain: NiceErrorDomain<DEF>,
  id: ID,
  handler: (error: NiceErrorHydrated<DEF, ID>) => MaybePromise<H_RES>,
): NiceErrorHandler<never, H_RES> {
  return new NiceErrorHandler<never, never>().forId(domain, id, handler);
}

export function forIds<
  DEF extends INiceErrorDomainProps,
  IDS extends TDomainNiceErrorId<DEF>[],
  H_RES = void,
>(
  domain: NiceErrorDomain<DEF>,
  ids: IDS,
  handler: (error: NiceErrorHydrated<DEF, IDS[number]>) => MaybePromise<H_RES>,
): NiceErrorHandler<never, H_RES> {
  return new NiceErrorHandler<never, never>().forIds(domain, ids, handler);
}
