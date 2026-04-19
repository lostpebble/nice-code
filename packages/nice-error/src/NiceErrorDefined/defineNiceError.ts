import type {
  IDefineNewNiceErrorDomainOptions,
  TNiceErrorSchema,
} from "../NiceError/NiceError.types";
import { NiceErrorDomain } from "./NiceErrorDefined";

export const defineNiceError = <ERR_DOMAIN extends string, SCHEMA extends TNiceErrorSchema>(
  definition: IDefineNewNiceErrorDomainOptions<ERR_DOMAIN, SCHEMA>,
) => {
  // const {} = import("./NiceErrorDefined");
  return new NiceErrorDomain<{
    domain: ERR_DOMAIN;
    allDomains: [ERR_DOMAIN];
    schema: SCHEMA;
  }>({
    domain: definition.domain,
    allDomains: [definition.domain],
    schema: definition.schema,
    ...(definition.packAs != null ? { packAs: definition.packAs } : {}),
  });
};
