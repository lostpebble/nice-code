import type { NiceError } from "../../NiceError/NiceError";
import type { EErrorPackType } from "./packError.enums";
export declare const packError: <E extends NiceError<any, any>>(error: E, packType?: EErrorPackType) => E;
