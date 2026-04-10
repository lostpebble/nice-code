import { defineNiceError, EErrorPackType, err } from "@nice-error/core";

export enum EErrId_DemoNiceBackend {
  simple_error_no_context = "simple_error_no_context",
  error_with_context = "error_with_context",
  error_with_serializable_context = "error_with_serializable_context",
}

export const errorGlobalEnv: {
  packAs: EErrorPackType;
} = {
  packAs: EErrorPackType.no_pack,
};

export const demo_err_nice = defineNiceError({
  domain: "err_nice_backend",
  packAs: () => {
    return errorGlobalEnv.packAs;
  },
  schema: {
    [EErrId_DemoNiceBackend.simple_error_no_context]: err({
      message: "This is a simple error with no context",
      httpStatusCode: 400,
    }),
    [EErrId_DemoNiceBackend.error_with_context]: err<{ detail: string }>({
      message: ({ detail }) => `This error has context: ${detail}`,
      httpStatusCode: 400,
    }),
    [EErrId_DemoNiceBackend.error_with_serializable_context]: err<
      { dateNow: Date },
      { isoString: string }
    >({
      message: ({ dateNow }) => `This error has serializable context: ${dateNow.toISOString()}`,
      httpStatusCode: 400,
      context: {
        required: true,
        serialization: {
          fromJsonSerializable: ({ isoString }) => {
            return {
              dateNow: new Date(isoString),
            };
          },
          toJsonSerializable: ({ dateNow }) => {
            return {
              isoString: dateNow.toISOString(),
            };
          },
        },
      },
    }),
  },
} as const);
