import {
  type INiceErrorDomainProps,
  type JSONSerializableValue,
  type NiceError,
  type NiceErrorDomain,
} from "@nice-code/error";
import type { StandardSchemaV1 } from "@standard-schema/spec";

export type TNiceActionJsonSerializableValue = JSONSerializableValue;

export type TTransportedValue<
  RAW_VAL = never,
  SERDE_VAL extends TNiceActionJsonSerializableValue = never,
> = RAW_VAL extends TNiceActionJsonSerializableValue
  ? [RAW_VAL] | [RAW_VAL, SERDE_VAL]
  : [RAW_VAL, SERDE_VAL];

export type TNiceActionSerializationDefinition<
  RAW_VAL = any,
  SERDE_VAL extends TNiceActionJsonSerializableValue = TNiceActionJsonSerializableValue,
> = {
  serialize: (value: RAW_VAL) => SERDE_VAL;
  deserialize: (value: SERDE_VAL) => RAW_VAL;
};

export type TNiceActonSchemaOptions<
  VS extends StandardSchemaV1 = StandardSchemaV1,
  SERDE_IN extends TNiceActionJsonSerializableValue = TNiceActionJsonSerializableValue,
> =
  StandardSchemaV1.InferInput<VS> extends TNiceActionJsonSerializableValue
    ? {
        schema: VS;
        serialization?: TNiceActionSerializationDefinition<
          StandardSchemaV1.InferInput<VS>,
          SERDE_IN
        >;
      }
    : {
        schema: VS;
        serialization: TNiceActionSerializationDefinition<
          StandardSchemaV1.InferInput<VS>,
          SERDE_IN
        >;
      };

/**
 * One error declaration on an action schema.
 * `IDS` is the subset of error IDs that may be thrown. When the full
 * `keyof schema` union is used it means any ID from the domain can be thrown.
 *
 * Build via `action().throws(domain)` or `action().throws(domain, ids)`.
 */
export interface INiceActionErrorDeclaration<
  ERR_DEF extends INiceErrorDomainProps = INiceErrorDomainProps,
  IDS extends keyof ERR_DEF["schema"] & string = keyof ERR_DEF["schema"] & string,
> {
  readonly _domain: NiceErrorDomain<ERR_DEF>;
  /** The specific IDs constrained for this declaration, or `undefined` meaning the full domain. */
  readonly _ids: ReadonlyArray<IDS & string> | undefined;
}

// ---------------------------------------------------------------------------
// Inference helpers
// ---------------------------------------------------------------------------

/** @internal Maps a single INiceActionErrorDeclaration to its NiceError type. */
type TInferErrorFromDeclaration<D> =
  D extends INiceActionErrorDeclaration<infer DEF, infer IDS> ? NiceError<DEF, IDS> : never;

/**
 * Union of all `NiceError` types that can be thrown from a tuple of error declarations.
 * Distributes over each declaration and unions the results.
 */
export type TInferDeclaredErrors<DECLS extends readonly INiceActionErrorDeclaration[]> =
  TInferErrorFromDeclaration<DECLS[number]>;
