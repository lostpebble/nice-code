import type { IInspectErrorResult_JsError, IInspectErrorResult_JsErrorObject, IInspectErrorResult_JsOther, IInspectErrorResult_Nullish, TInspectErrorResult_JsDataType } from "../utils/inspectPotentialError/inspectPotentialError.types";
export declare const err_nice: import("..").NiceErrorDefined<{
    domain: "err_nice";
    allDomains: ["err_nice"];
    schema: {};
}>;
export declare enum EErrId_CastNotNice {
    js_error = "native_error",
    js_error_like_object = "js_error_like_object",
    nullish_value = "nullish_value",
    js_data_type = "js_data_type",
    js_other = "js_other"
}
export declare const err_cast_not_nice: import("..").NiceErrorDefined<{
    domain: string;
    allDomains: [string, "err_nice"];
    schema: {
        native_error: import("..").INiceErrorIdMetadata<IInspectErrorResult_JsError, import("..").JSONSerializableValue> & {
            context: {
                required: true;
            };
        };
        js_error_like_object: import("..").INiceErrorIdMetadata<IInspectErrorResult_JsErrorObject, import("..").JSONSerializableValue> & {
            context: {
                required: true;
            };
        };
        nullish_value: import("..").INiceErrorIdMetadata<IInspectErrorResult_Nullish, import("..").JSONSerializableValue> & {
            context: {
                required: true;
            };
        };
        js_data_type: import("..").INiceErrorIdMetadata<TInspectErrorResult_JsDataType, import("..").JSONSerializableValue> & {
            context: {
                required: true;
            };
        };
        js_other: import("..").INiceErrorIdMetadata<IInspectErrorResult_JsOther, import("..").JSONSerializableValue> & {
            context: {
                required: true;
            };
        };
    };
}>;
