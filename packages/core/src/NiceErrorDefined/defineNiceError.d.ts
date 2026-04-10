import type { IDefineNewNiceErrorDomainOptions, TNiceErrorSchema } from "../NiceError/NiceError.types";
import { NiceErrorDefined } from "./NiceErrorDefined";
export declare const defineNiceError: <ERR_DOMAIN extends string, SCHEMA extends TNiceErrorSchema>(definition: IDefineNewNiceErrorDomainOptions<ERR_DOMAIN, SCHEMA>) => NiceErrorDefined<{
    domain: ERR_DOMAIN;
    allDomains: [ERR_DOMAIN];
    schema: SCHEMA;
}>;
