import { nanoid } from "nanoid";
import type { Transport } from "../..";
import type { NiceActionDomain } from "../../ActionDomain/NiceActionDomain";
import type { INiceActionDomain } from "../../ActionDomain/NiceActionDomain.types";
import type { INiceActionPrimed_JsonObject } from "../../NiceAction/NiceAction.types";
import type { NiceActionPrimed } from "../../NiceAction/NiceActionPrimed";
import type { NiceActionResponse } from "../../NiceAction/NiceActionResponse";
import {
  EActionHandlerType,
  type IActionHandler,
  type TMatchHandlerKey,
} from "../ActionHandler/ActionHandler.types";
import type {
  IActionConnectConfig,
  IActionConnectHandleIncomingRequest,
  IActionConnectRouteRequest,
} from "./ActionConnect.types";
import { ConnectionConfig } from "./ConnectionConfig/ConnectionConfig";
import { EErrId_NiceTransport, err_nice_transport } from "./Transport/err_nice_transport";

const DEFAULT_TIMEOUT = 30_000;

export class ActionConnect<TRANS_KEY extends string = never> implements IActionHandler {
  readonly tag: string | "_";
  readonly handlerType = EActionHandlerType.connect;
  readonly cuid: string;

  private _config: IActionConnectConfig;
  private _connections: Map<TRANS_KEY | "_", ConnectionConfig<any>> = new Map();
  private _connectionByMatchKey = new Map<
    TMatchHandlerKey,
    IActionConnectRouteRequest<any, TRANS_KEY, any>
  >();
  private _handlerKeys = new Set<TMatchHandlerKey>();
  private _incomingActionRequestHandlers: Map<
    TMatchHandlerKey,
    {
      domain: NiceActionDomain<any>;
      handleRequest?: IActionConnectHandleIncomingRequest<any, TRANS_KEY, any>;
    }
  > = new Map();

  constructor(
    connectionConfigs: Array<ConnectionConfig<TRANS_KEY | undefined>>,
    config: IActionConnectConfig = {},
  ) {
    this.tag = config.tag ?? "_";
    this.cuid = nanoid();
    this._config = { requestTimeout: DEFAULT_TIMEOUT, ...config };

    for (const conn of connectionConfigs) {
      const routeKey = conn.routeKey ?? "_";

      conn.addIncomingRequestHandler((primedJson, preferredTransport: Transport<any>) => {
        this.receiveActionRequest(primedJson, preferredTransport);
      });
      this._connections.set(routeKey, conn);
    }
  }

  get allHandlerKeys(): TMatchHandlerKey[] {
    return [...this._handlerKeys];
  }

  routeDomain<DOM extends INiceActionDomain>(
    domain: NiceActionDomain<DOM>,
    route: IActionConnectRouteRequest<DOM, TRANS_KEY> = {},
  ): this {
    this._connectionByMatchKey.set(`${domain.domain}::_`, route);
    this._handlerKeys.add(`${this.tag}::${domain.domain}::_`);
    return this;
  }

  routeAction<DOM extends INiceActionDomain, ID extends keyof DOM["actions"] & string>(
    domain: NiceActionDomain<DOM>,
    id: ID,
    route: IActionConnectRouteRequest<DOM, TRANS_KEY, ID> = {},
  ): this {
    this._connectionByMatchKey.set(`${domain.domain}::${id}`, route);
    this._handlerKeys.add(`${this.tag}::${domain.domain}::${id}`);
    return this;
  }

  routeActionIds<
    DOM extends INiceActionDomain,
    IDS extends ReadonlyArray<keyof DOM["actions"] & string>,
  >(
    domain: NiceActionDomain<DOM>,
    ids: IDS,
    route: IActionConnectRouteRequest<DOM, TRANS_KEY, IDS[number]> = {},
  ): this {
    for (const id of ids) {
      this.routeAction(domain, id, route);
    }
    return this;
  }

  incomingRequestDomain<DOM extends INiceActionDomain>(
    domain: NiceActionDomain<DOM>,
    handleRequest?: IActionConnectHandleIncomingRequest<DOM, TRANS_KEY, any>,
  ): this {
    this._incomingActionRequestHandlers.set(`${domain.domain}::_`, { domain, handleRequest });
    return this;
  }

  private async receiveActionRequest(
    primed: INiceActionPrimed_JsonObject<any, any>,
    preferredTransport: Transport<any>,
  ): Promise<void> {
    const incomingRequestHandler =
      this._incomingActionRequestHandlers.get(`${primed.domain}::${primed.id}`) ??
      this._incomingActionRequestHandlers.get(`${primed.domain}::_`);

    if (!incomingRequestHandler) {
      // No matching domain handler, ignore the request
      return;
    }

    const hydrated = incomingRequestHandler.domain.hydratePrimed(primed);
    let response: NiceActionResponse<any, any>;

    if (incomingRequestHandler.handleRequest?.onActionRequest) {
      response = await incomingRequestHandler.handleRequest.onActionRequest(hydrated);
    } else {
      response = await hydrated.executeToResponse();
    }

    await this.dispatchActionResponse(
      response,
      preferredTransport,
      incomingRequestHandler.handleRequest?.responseRouteKey,
    );
  }

  async dispatchActionResponse(
    response: NiceActionResponse<any, any>,
    preferredTransport: Transport<any>,
    routeKey?: TRANS_KEY,
  ): Promise<void> {
    await this._dispatchResponseViaRoute(response, preferredTransport, routeKey);
  }

  async dispatchActionRequest(
    primed: NiceActionPrimed<any, any>,
  ): Promise<NiceActionResponse<any, any>> {
    const route =
      this._connectionByMatchKey.get(`${primed.domain}::${primed.id}`) ??
      this._connectionByMatchKey.get(`${primed.domain}::_`);

    return this._dispatchRequestViaRoute(primed, route);
  }

  disconnect(): void {
    for (const conn of this._connections.values()) {
      conn.disconnect();
    }
  }

  private async _dispatchResponseViaRoute(
    response: NiceActionResponse<any, any>,
    preferredTransport: Transport<any>,
    routeKey?: TRANS_KEY,
  ): Promise<void> {
    const conn = this._connections.get(routeKey ?? "_");

    if (conn == null) {
      return Promise.reject(
        err_nice_transport.fromId(EErrId_NiceTransport.not_found, {
          actionId: response.id,
          routeKey: routeKey,
          tag: this.tag !== "_" ? this.tag : undefined,
        }),
      );
    }

    await conn.dispatchResponse(response, preferredTransport);
  }

  private async _dispatchRequestViaRoute(
    primed: NiceActionPrimed<any, any>,
    route?: IActionConnectRouteRequest<any, TRANS_KEY>,
  ): Promise<NiceActionResponse<any, any>> {
    const conn = this._connections.get(route?.routeKey ?? "_");

    if (conn == null) {
      return Promise.reject(
        err_nice_transport.fromId(EErrId_NiceTransport.not_found, {
          actionId: primed.id,
          routeKey: route?.routeKey,
          tag: this.tag !== "_" ? this.tag : undefined,
        }),
      );
    }

    const response = await conn.dispatchRequest(
      primed,
      this._config.requestTimeout ?? DEFAULT_TIMEOUT,
    );

    if (route?.onResponse) {
      route.onResponse(response);
    }

    return response;
  }
}
