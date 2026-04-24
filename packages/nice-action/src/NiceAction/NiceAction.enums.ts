export enum EActionState {
  empty = "empty",
  primed = "primed",
  resolved = "resolved",
}

export enum EActionRouteStep {
  start_request = "start_request",
  request_sent = "request_sent",
  request_received = "request_received",
  resolved = "resolved",
  response_sent = "response_sent",
  response_received = "response_received",
  completed = "completed",
}

export enum EActionRequestExpectation {
  response = "response",
  no_response = "no_response",
}
