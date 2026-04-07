import { z } from "zod";

export const zMeteorErrorObject = z.object({
  isUnknownError: z.boolean(),
  errorIds: z.array(z.string()),
  context: z.record(z.unknown()),
  message: z.string(),
  name: z.literal("MeteorError"),
  subtype: z.string().optional(),
});
