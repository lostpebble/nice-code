import type { INiceErrorIdMetadata } from "../NiceError/NiceError.types";

export const err = <C = never>(
  meta: INiceErrorIdMetadata<C> = {} as INiceErrorIdMetadata<C>,
): INiceErrorIdMetadata<C> => meta;
