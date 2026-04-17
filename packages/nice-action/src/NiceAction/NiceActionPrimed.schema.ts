import type { JSONSerializableValue } from "@nice-code/error";
import * as v from "valibot";

export const vNiceActionPrimedJsonObject = v.object({
  id: v.string(),
  domain: v.string(),
  allDomains: v.array(v.string()),
  input: v.custom<JSONSerializableValue>(() => true),
});
