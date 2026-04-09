import type { NiceError } from "../../NiceError/NiceError";
import { causePack } from "./causePack";
import { msgPack } from "./msgPack";
import type { EErrorPackType } from "./packError.enums";

export const packError = (
  error: NiceError<any, any>,
  packType: EErrorPackType = "cause_pack" as EErrorPackType,
): Error => {
  if (packType === "msg_pack") {
    return msgPack(error);
  }
  return causePack(error);
};
