import type { TActionTransportDef } from "../Transport/Transport.types";

export interface IConnectionConfig {
  defaultTimeout?: number;
  transports: TActionTransportDef[];
}
