export const err_example_app = createNiceError({
  id: "err_example_app",
});

export enum EErrId_UserAuth {
  invalid_credentials = "invalid_credentials",
  account_locked = "account_locked",
}

export const err_user_auth = err_example_app.createSubError({
  id: "err_user_auth",
} as const);
