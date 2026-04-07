import { notNullEmpty } from "@meteorwallet/utils/javascript_type_utils/string.utils";

export function getAllMeteorErrorSubtypes(err?: any): string[] {
  const subtypes: string[] = [];

  if (notNullEmpty(err?.subtype)) {
    subtypes.push(err.subtype);
  }

  if (err?.subtypes != null && Array.isArray(err.subtypes)) {
    subtypes.push(...err.subtypes);
  }

  return subtypes;
}