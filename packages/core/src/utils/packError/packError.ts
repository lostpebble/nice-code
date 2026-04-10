import type { NiceError } from "../../NiceError/NiceError";
import { causePack } from "./causePack";
import { msgPack } from "./msgPack";
import type { EErrorPackType } from "./packError.enums";

export const packError = <E extends NiceError<any, any>>(
  error: E,
  packType: EErrorPackType = "cause_pack" as EErrorPackType,
): E => {
  if (packType === "msg_pack") {
    return msgPack(error);
  }
  return causePack(error);
};
