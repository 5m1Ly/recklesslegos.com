"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  type AdminContentChange,
  applyAdminContentChange,
} from "@/app/admin/content-actions";
import { useAdmin } from "@/components/admin-provider";
import { ProposalFields } from "@/components/proposal-form";
import {
  PROPOSAL_TYPES,
  type ProposalType,
  rowToValues,
} from "@/lib/proposal-types";
import { actionErrorMessage } from "@/lib/stale-action";

// ── Add button (page/section level) ───────────────────────────────────────

/** "+ Add …" button shown to admins; opens the editor in add mode. */
export function AdminAddButton({
  type,
  className = "btn btn-primary",
}: {
  type: ProposalType;
  className?: string;
}) {
  const isAdmin = useAdmin();
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;

  const def = PROPOSAL_TYPES[type];
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        + Add {def.label.toLowerCase()}
      </button>
      {open && (
        <AdminEditModal
          type={type}
          op="add"
          targetId={null}
          initial={{}}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ── Per-item Edit / Delete controls ────────────────────────────────────────

/** Edit + Delete controls for a single content row, shown only to admins. */
export function AdminItemControls({
  type,
  id,
  row,
  className,
  style,
}: {
  type: ProposalType;
  id: string;
  // Accept any content row (Prisma model types lack a string index signature);
  // rowToValues only reads the registry's known field keys.
  row: object;
  className?: string;
  style?: React.CSSProperties;
}) {
  const isAdmin = useAdmin();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!isAdmin) return null;

  const def = PROPOSAL_TYPES[type];

  const handleDelete = () => {
    setError(null);
    if (
      !window.confirm(
        `Delete this ${def.label.toLowerCase()}? This cannot be undone.`,
      )
    )
      return;
    startTransition(async () => {
      try {
        const res = await applyAdminContentChange({
          type,
          op: "remove",
          targetId: id,
        });
        if (!res.ok) {
          setError(res.error ?? "Couldn't delete.");
          return;
        }
        router.refresh();
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  return (
    <div
      className={className}
      style={{ display: "flex", gap: 14, alignItems: "center", ...style }}
    >
      <button
        type="button"
        className="mono-sm"
        style={{
          color: "var(--blue)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
        disabled={pending}
        onClick={() => setEditing(true)}
      >
        Edit
      </button>
      <button
        type="button"
        className="mono-sm"
        style={{
          color: "var(--red)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
        disabled={pending}
        onClick={handleDelete}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span className="mono-sm" style={{ color: "var(--red)" }}>
          {error}
        </span>
      )}
      {editing && (
        <AdminEditModal
          type={type}
          op="edit"
          targetId={id}
          initial={rowToValues(def, row as Record<string, unknown>)}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

// ── Editor modal (add / edit) ──────────────────────────────────────────────

function AdminEditModal({
  type,
  op,
  targetId,
  initial,
  onClose,
}: {
  type: ProposalType;
  op: AdminContentChange["op"];
  targetId: string | null;
  initial: Record<string, string>;
  onClose: () => void;
}) {
  const def = PROPOSAL_TYPES[type];
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setVal = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const valid = def.fields
    .filter((f) => f.required && f.kind !== "boolean")
    .every((f) => (values[f.key] ?? "").trim() !== "");

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await applyAdminContentChange({
          type,
          op,
          targetId,
          payload: values,
        });
        if (!res.ok) {
          setError(res.error ?? "Couldn't save.");
          return;
        }
        router.refresh();
        onClose();
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(5,8,11,0.82)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: 24,
        overflowY: "auto",
        border: "none",
        cursor: "default",
      }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop-propagation-only wrapper */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stop-propagation-only wrapper */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="card card-pad"
        style={{
          width: "min(640px, 96vw)",
          marginTop: "5vh",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          textAlign: "left",
          cursor: "auto",
        }}
      >
        <div className="tag solid" style={{ alignSelf: "flex-start" }}>
          {op === "add" ? "Add" : "Edit"} · {def.label}
        </div>

        {error && (
          <div
            className="card card-pad"
            style={{ borderColor: "var(--red)", color: "var(--red)" }}
          >
            {error}
          </div>
        )}

        <ProposalFields
          fields={def.fields}
          values={values}
          onChange={setVal}
          disabled={pending}
        />

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid || pending}
            onClick={handleSave}
          >
            {pending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pending}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </button>
  );
}
