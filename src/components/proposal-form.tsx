"use client";

import type { FieldDef } from "@/lib/proposal-types";

/** Label + optional hint wrapper around a form control. */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "block" }}>
      <span className="mono-label">{label}</span>
      {hint && (
        <span className="mono-sm" style={{ marginLeft: 8 }}>
          {hint}
        </span>
      )}
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

/** Render a single proposal field by its kind. Values are all strings;
 *  booleans are "true"/"false". Coercion to real types happens server-side. */
function FieldInput({
  f,
  value,
  onChange,
  disabled,
}: {
  f: FieldDef;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  if (f.kind === "boolean") {
    return (
      <label
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={value === "true"}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked ? "true" : "false")}
        />
        <span className="body-txt" style={{ margin: 0 }}>
          {f.label}
        </span>
      </label>
    );
  }

  let control: React.ReactNode;
  switch (f.kind) {
    case "textarea":
      control = (
        <textarea
          className="ipt"
          rows={4}
          value={value}
          maxLength={f.maxLen}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "select":
      control = (
        <select
          className="select"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {f.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
      break;
    case "date":
      control = (
        <input
          type="date"
          className="ipt"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "number":
      control = (
        <input
          type="number"
          className="ipt"
          value={value}
          min={0}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    case "url":
      control = (
        <input
          type="url"
          className="ipt"
          value={value}
          disabled={disabled}
          placeholder="https://…"
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;
    default:
      control = (
        <input
          type="text"
          className="ipt"
          value={value}
          maxLength={f.maxLen}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <Field label={f.label} hint={f.hint}>
      {control}
    </Field>
  );
}

/** Render all fields for a content type. `values`/`onChange` are string-keyed. */
export function ProposalFields({
  fields,
  values,
  onChange,
  disabled,
}: {
  fields: FieldDef[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <>
      {fields.map((f) => (
        <FieldInput
          key={f.key}
          f={f}
          value={values[f.key] ?? ""}
          onChange={(v) => onChange(f.key, v)}
          disabled={disabled}
        />
      ))}
    </>
  );
}
