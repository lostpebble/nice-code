import { err } from "@nice-code/error";
import { err_nice_transport } from "./err_nice_transport";

export enum EErrId_NiceTransport_WebSocket {
  ws_disconnected = "ws_disconnected",
  ws_create_failed = "ws_create_failed",
  ws_error = "ws_error",
}

export const err_nice_transport_ws = err_nice_transport.createChildDomain({
  domain: "ws_transport",
  schema: {
    [EErrId_NiceTransport_WebSocket.ws_disconnected]: err<Record<string, never>>({
      message: () => `WebSocket transport disconnected.`,
    }),
    [EErrId_NiceTransport_WebSocket.ws_create_failed]: err<{
      originalError?: Error;
    }>({
      message: ({ originalError }) =>
        `Failed to create WebSocket transport.${originalError ? ` Original error: ${originalError.message}` : ""}`,
    }),
    [EErrId_NiceTransport_WebSocket.ws_error]: err<{
      originalError?: Error;
    }>({
      message: ({ originalError }) =>
        `WebSocket transport error.${originalError ? ` Original error: ${originalError.message}` : ""}`,
    }),
  },
});
