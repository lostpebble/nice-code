export interface IActionConnectConfig {
  tag?: string;
  /** URL for HTTP fallback POST requests. Required when enableHttpFallback is true. */
  httpFallbackUrl?: string;
  /** Enable HTTP POST fallback when no WebSocket transport is connected. Default: true */
  enableHttpFallback?: boolean;
  /** Timeout (ms) for pending dispatched requests. Default: 30_000 */
  requestTimeout?: number;
}

export interface IActionConnectTransport {
  send(data: string): void;
  readonly connected: boolean;
}

export interface IAttachTransportOptions {
  /** Named key for this transport — used with route options { transportKey } to target it. */
  key?: string;
}

/** Route config for a domain or action — controls which transport handles the dispatch. */
export interface IActionConnectRoute {
  /** Send via this named transport. Omit to use the default (unnamed) transport. */
  transportKey?: string;
}

export interface IDispatchOptions {
  /** Bypass routing config and send via this named transport instead. */
  transportKey?: string;
}
