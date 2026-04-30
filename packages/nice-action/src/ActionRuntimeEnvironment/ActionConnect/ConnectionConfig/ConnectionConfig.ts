import type { INiceActionPrimed_JsonObject } from "../../../NiceAction/NiceAction.types";
import type { NiceActionPrimed } from "../../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../../NiceAction/NiceActionResponse";
import { EErrId_NiceTransport, err_nice_transport } from "../Transport/err_nice_transport";
import { Transport } from "../Transport/Transport";
import type { TOnResolveIncomingRequest } from "../Transport/Transport.types";
import { TransportHttp } from "../Transport/TransportHttp";
import { TransportWebSocket } from "../Transport/TransportWebSocket";
import { ETransportStatus, ETransportType, type IConnectionConfig } from "./ConnectionConfig.types";

export class ConnectionConfig<K extends string | undefined = undefined> {
  readonly config: IConnectionConfig;
  readonly routeKey: K | undefined;

  private _transports: Transport<any>[] = [];
  private _incomingRequestHandlers: Array<TOnResolveIncomingRequest> = [];

  constructor(input: IConnectionConfig, routeKey?: K) {
    this.config = input;
    this.routeKey = routeKey;

    for (const def of this.config.transports) {
      if (def.type === ETransportType.ws) {
        this._transports.push(new TransportWebSocket(def, this.onIncomingRequest));
      } else if (def.type === ETransportType.http) {
        this._transports.push(new TransportHttp(def, this.onIncomingRequest));
      } else {
        throw new Error(`Unsupported transport type: ${(def as any).type}`);
      }
    }
  }

  get connected(): boolean {
    return this._transports.some((t) => t.status.status === ETransportStatus.ready);
  }

  protected onIncomingRequest: TOnResolveIncomingRequest = (
    primedJson: INiceActionPrimed_JsonObject<any>,
    preferredTransport: Transport<any>,
  ) => {
    for (const handler of this._incomingRequestHandlers) {
      handler(primedJson, preferredTransport);
    }
  };

  addIncomingRequestHandler(
    handler: (
      primedJson: INiceActionPrimed_JsonObject<any>,
      preferredTransport: Transport<any>,
    ) => void,
  ): () => void {
    this._incomingRequestHandlers.push(handler);
    return () => {
      const index = this._incomingRequestHandlers.indexOf(handler);
      if (index !== -1) {
        this._incomingRequestHandlers.splice(index, 1);
      }
    };
  }

  private async _getReadyTransport(
    action: NiceActionPrimed<any> | NiceActionResponse<any>,
    preferredTransport?: Transport<any>,
  ): Promise<Transport<any>> {
    const initializingWaiters: Promise<Transport<any>>[] = [];
    const unavailableTransports: Transport<any>[] = [];

    let transportList = this._transports;

    if (preferredTransport) {
      transportList = [
        preferredTransport,
        ...transportList.filter((t) => t.transportOrd !== preferredTransport.transportOrd),
      ];
    }

    for (const transport of transportList) {
      const isAvailable = transport.filterUsage(action);

      if (isAvailable instanceof Promise) {
        try {
          if (!(await isAvailable)) {
            unavailableTransports.push(transport);
            continue;
          }
        } catch {
          unavailableTransports.push(transport);
          continue;
        }
      } else if (!isAvailable) {
        unavailableTransports.push(transport);
        continue;
      }

      const statusInfo = transport.checkAndPrepare();

      if (statusInfo.status === ETransportStatus.ready) {
        return transport;
      }
      if (statusInfo.status === ETransportStatus.initializing) {
        initializingWaiters.push(
          statusInfo.waitForInitialization.then((info) => {
            if (info.newStatus.status !== ETransportStatus.ready) {
              throw info.newStatus;
            }
            return transport;
          }),
        );
      }
    }

    if (initializingWaiters.length === 0) {
      if (unavailableTransports.length > 0) {
        throw err_nice_transport.fromId(EErrId_NiceTransport.not_available, {
          transportCount: unavailableTransports.length,
        });
      }

      throw err_nice_transport.fromId(EErrId_NiceTransport.not_found, {
        actionId: action.id,
      });
    }

    try {
      return await Promise.any(initializingWaiters);
    } catch (e) {
      throw err_nice_transport
        .fromId(EErrId_NiceTransport.initialization_failed, {
          actionId: action.id,
        })
        .withOriginError(e);
    }
  }

  async dispatchResponse(
    response: NiceActionResponse<any>,
    preferredTransport: Transport<any>,
  ): Promise<void> {
    const transport = await this._getReadyTransport(response, preferredTransport);
    await transport.sendResponse(response);
  }

  async dispatchRequest(
    primed: NiceActionPrimed<any>,
    defaultTimeout: number,
  ): Promise<NiceActionResponse<any>> {
    const timeout = this.config.defaultTimeout ?? defaultTimeout;

    const transport = await this._getReadyTransport(primed);
    return transport.makeRequest(primed, timeout);
  }

  disconnect(): void {
    for (const transport of this._transports) {
      transport.disconnect();
    }
  }
}
