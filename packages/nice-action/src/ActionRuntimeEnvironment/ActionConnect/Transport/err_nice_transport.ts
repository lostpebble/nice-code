import { err } from "@nice-code/error";
import { err_nice_connect } from "../err_nice_connect";

export enum EErrId_NiceTransport {
  timeout = "timeout",
  not_found = "not_found",
  initialization_failed = "initialization_failed",
  send_failed = "send_failed",
  invalid_action_response = "invalid_action_response",
}

export const err_nice_transport = err_nice_connect.createChildDomain({
  domain: "err_nice_transport",
  schema: {
    [EErrId_NiceTransport.timeout]: err<{ timeout: number }>({
      message: ({ timeout }) => `ActionConnect transport timed out after ${timeout}ms.`,
    }),
    [EErrId_NiceTransport.not_found]: err<{
      actionId: string;
      routeKey?: string;
      tag?: string;
    }>({
      message: ({ actionId, routeKey, tag }) =>
        `No connected transport found for action "${actionId}"${routeKey ? ` with route key "${routeKey}"` : ``}${tag ? ` and action tag "${tag}"` : ""}.`,
    }),
    [EErrId_NiceTransport.initialization_failed]: err<{
      actionId: string;
      routeKey?: string;
      tag?: string;
    }>({
      message: ({ actionId, routeKey, tag }) =>
        `Transports found for action "${actionId}"${routeKey ? ` with route key "${routeKey}"` : ""}${tag ? ` and action tag "${tag}"` : ""}, but none are ready.`,
    }),
    [EErrId_NiceTransport.send_failed]: err<{
      actionId: string;
      httpStatusCode?: number;
      message?: string;
    }>({
      message: ({ actionId, httpStatusCode, message }) =>
        `Failed to send action "${actionId}" [${httpStatusCode ?? "Unknown status"}]: ${message ?? "Unknown error"}.`,
      httpStatusCode: ({ httpStatusCode }) => httpStatusCode ?? 500,
    }),
    [EErrId_NiceTransport.invalid_action_response]: err<{
      actionId: string;
    }>({
      message: ({ actionId }) => `Invalid action response JSON structure for action "${actionId}"`,
    }),
  },
});
