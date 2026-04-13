import type { ISerializedNiceActionResponse } from "@nice-error/nice-action";
import { useState } from "react";
import { ACTION_META, type IActionMeta, type IFieldMeta, type TFieldType } from "../actions/action_field_meta";
import { demoDomain } from "../actions/demo_action_domain";

const BACKEND_URL = import.meta.env["VITE_BACKEND_URL"] as string;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

let _uid = 0;
function nextUid() {
  return String(++_uid);
}

interface IFieldRow {
  uid: string;
  key: string;
  label: string;
  type: TFieldType;
  value: string;
}

function buildFieldRows(meta: IActionMeta): IFieldRow[] {
  return meta.fields.map((f: IFieldMeta) => ({
    uid: nextUid(),
    key: f.key,
    label: f.label,
    type: f.type,
    value: String(f.defaultValue),
  }));
}

function parseFieldValue(row: IFieldRow): string | number {
  if (row.type === "number") {
    const n = Number(row.value);
    return Number.isNaN(n) ? 0 : n;
  }
  return row.value;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActionTester() {
  const [selectedActionId, setSelectedActionId] = useState<string>(ACTION_META[0].id);
  const [fields, setFields] = useState<IFieldRow[]>(() => buildFieldRows(ACTION_META[0]));
  const [result, setResult] = useState<ISerializedNiceActionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleActionChange(actionId: string) {
    setSelectedActionId(actionId);
    const meta = ACTION_META.find((a) => a.id === actionId);
    if (meta != null) {
      setFields(buildFieldRows(meta));
    }
    setResult(null);
    setError(null);
  }

  function handleFieldChange(index: number, value: string) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, value } : f)));
  }

  function handleAddField() {
    setFields((prev) => [
      ...prev,
      { uid: nextUid(), key: `field_${prev.length}`, label: `Field ${prev.length}`, type: "string", value: "" },
    ]);
  }

  function handleRemoveField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFieldKeyChange(index: number, key: string) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, key, label: key } : f)));
  }

  function handleFieldTypeChange(index: number, type: TFieldType) {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, type } : f)));
  }

  async function handleExecute() {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Build input object from current field rows
      const input: Record<string, string | number> = {};
      for (const field of fields) {
        input[field.key] = parseFieldValue(field);
      }

      // Construct wire format (ISerializedNiceAction) — exercises the transport layer
      const wire = { domain: demoDomain.domain, actionId: selectedActionId, input };

      const res = await fetch(`${BACKEND_URL}resolve_action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wire),
      });

      const json = (await res.json()) as ISerializedNiceActionResponse;
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const selectedMeta = ACTION_META.find((a) => a.id === selectedActionId);

  return (
    <div className="action-tester">
      {/* Action selector */}
      <div className="card">
        <h2>Select Action</h2>
        <div className="select-row">
          <select
            value={selectedActionId}
            onChange={(e) => handleActionChange(e.target.value)}
            className="action-select"
          >
            {ACTION_META.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        {selectedMeta != null && (
          <p className="action-description">{selectedMeta.description}</p>
        )}
      </div>

      {/* Input fields */}
      <div className="card">
        <div className="fields-header">
          <h2>Input Fields</h2>
          <button className="btn-secondary" onClick={handleAddField}>
            + Add Field
          </button>
        </div>

        {fields.length === 0 && (
          <p className="empty-fields">No fields. Click "+ Add Field" to add one.</p>
        )}

        {fields.map((field, i) => (
          <div key={field.uid} className="field-row">
            <input
              className="field-key-input"
              value={field.key}
              onChange={(e) => handleFieldKeyChange(i, e.target.value)}
              placeholder="key"
            />
            <select
              className="field-type-select"
              value={field.type}
              onChange={(e) => handleFieldTypeChange(i, e.target.value as TFieldType)}
            >
              <option value="string">string</option>
              <option value="number">number</option>
            </select>
            <input
              className="field-value-input"
              type={field.type === "number" ? "number" : "text"}
              value={field.value}
              onChange={(e) => handleFieldChange(i, e.target.value)}
              placeholder="value"
            />
            <button className="btn-remove" onClick={() => handleRemoveField(i)}>
              ✕
            </button>
          </div>
        ))}

        <div className="execute-row">
          <button className="btn-primary" onClick={handleExecute} disabled={loading}>
            {loading ? "Executing..." : "Execute"}
          </button>
        </div>
      </div>

      {/* Result */}
      {(result != null || error != null) && (
        <div className="card">
          <h2>Result</h2>

          {error != null && (
            <div className="result-error">
              <span className="badge badge-error">Client Error</span>
              <pre>{error}</pre>
            </div>
          )}

          {result != null && (
            <div className={result.ok ? "result-ok" : "result-action-error"}>
              <span className={`badge ${result.ok ? "badge-ok" : "badge-error"}`}>
                {result.ok ? "OK" : "Action Error"}
              </span>
              <div className="result-meta">
                <span>
                  domain: <code>{result.domain}</code>
                </span>
                <span>
                  action: <code>{result.actionId}</code>
                </span>
              </div>
              {result.ok ? (
                <pre>{JSON.stringify(result.value, null, 2)}</pre>
              ) : (
                <pre>{JSON.stringify(result.error, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
