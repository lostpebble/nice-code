import type { IErrContext_HonoStandardSchema } from "./err_validation.types";
export declare enum EValidator {
  standard_schema = "standard_schema",
}
export declare const err_validation: import("@nice-code/error").NiceErrorDefined<{
  domain: string;
  allDomains: [string, "err_nice"];
  schema: {
    standard_schema: import("@nice-code/error").INiceErrorIdMetadata<
      IErrContext_HonoStandardSchema,
      import("@nice-code/error").JSONSerializableValue
    >;
  };
}>;
