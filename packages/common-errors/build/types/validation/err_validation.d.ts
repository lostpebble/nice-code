import type { IErrContext_Valibot } from "./err_validation.types";
export declare enum EValidator {
    valibot = "valibot"
}
export declare const err_validation: import("@nice-error/core").NiceErrorDefined<{
    domain: string;
    allDomains: [string, "err_nice"];
    schema: {
        valibot: import("@nice-error/core").INiceErrorIdMetadata<IErrContext_Valibot, import("@nice-error/core").JSONSerializableValue>;
    };
}>;
