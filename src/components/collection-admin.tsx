"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applyAdminContentChange } from "@/app/admin/content-actions";
import { useAdmin } from "@/components/admin-provider";
import { Field } from "@/components/proposal-form";
import { CISubthemes } from "@/generated/prisma/enums";
import {
  CONDITION_LABELS,
  DISPOSITION_LABELS,
  DISPOSITION_ORDER,
  type EditEntry,
  type EditEvaluation,
  type ItemEditData,
  LOCATION_LABELS,
  LOCATION_ORDER,
  SOURCE_LABELS,
  SOURCE_ORDER,
} from "@/lib/collection";
import { actionErrorMessage } from "@/lib/stale-action";

// ── Option lists ──────────────────────────────────────────────────────────────

type Opt = [value: string, label: string];

const TYPE_OPTS: Opt[] = [
  ["SET", "Set"],
  ["MINIFIGURE", "Minifigure"],
];
const CONDITION_OPTS: Opt[] = (["BOXED", "USED"] as const).map((c) => [
  c,
  CONDITION_LABELS[c],
]);
const LOCATION_OPTS: Opt[] = LOCATION_ORDER.map((l) => [l, LOCATION_LABELS[l]]);
const DISPOSITION_OPTS: Opt[] = DISPOSITION_ORDER.map((d) => [
  d,
  DISPOSITION_LABELS[d],
]);
const SOURCE_OPTS: Opt[] = SOURCE_ORDER.map((s) => [s, SOURCE_LABELS[s]]);
const SUBTHEME_OPTS: Opt[] = Object.values(CISubthemes).map((s) => [s, s]);

// ── Row factories ─────────────────────────────────────────────────────────────

const newEntry = (): EditEntry => ({
  id: "",
  condition: "USED",
  location: "STORE",
  disposition: "FOR_SALE",
  isCrack: false,
  isBuild: false,
  isBuildWOFigs: false,
  costPrice: 0,
  displayPrice: 0,
  sellPrice: 0,
});

const newEval = (): EditEvaluation => ({
  id: "",
  source: "MANUAL",
  value: 0,
  valueLow: 0,
  valueHigh: 0,
  retail: 0,
  note: "",
});

const emptyItem = (): ItemEditData => ({
  id: "",
  autoEvaluate: true,
  name: "",
  legoRef: "",
  type: "SET",
  subtheme: "STARWARS",
  year: 0,
  pieces: 0,
  imageUrl: "",
  notes: "",
  entries: [newEntry()],
  evaluations: [],
});

// ── Small controls ────────────────────────────────────────────────────────────

function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: Opt[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <select
        className="select"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Num({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        className="ipt"
        min={0}
        value={value ? String(value) : ""}
        disabled={disabled}
        onChange={(e) =>
          onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))
        }
      />
    </Field>
  );
}

function Text({
  label,
  value,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        className="ipt"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="mono-sm">{label}</span>
    </label>
  );
}

const row3 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 10,
} as const;

// ── Editor modal ──────────────────────────────────────────────────────────────

function Editor({
  op,
  initial,
  onClose,
}: {
  op: "add" | "edit";
  initial: ItemEditData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [it, setIt] = useState<ItemEditData>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof ItemEditData>(k: K, v: ItemEditData[K]) =>
    setIt((p) => ({ ...p, [k]: v }));
  const setEntry = (i: number, patch: Partial<EditEntry>) =>
    setIt((p) => ({
      ...p,
      entries: p.entries.map((e, j) => (j === i ? { ...e, ...patch } : e)),
    }));
  const setEval = (i: number, patch: Partial<EditEvaluation>) =>
    setIt((p) => ({
      ...p,
      evaluations: p.evaluations.map((e, j) =>
        j === i ? { ...e, ...patch } : e,
      ),
    }));

  const valid = it.name.trim() !== "";

  const save = () => {
    setError(null);
    start(async () => {
      try {
        const res = await applyAdminContentChange({
          type: "legoset",
          op,
          targetId: op === "edit" ? it.id : null,
          payload: {
            name: it.name,
            legoRef: it.legoRef,
            type: it.type,
            subtheme: it.subtheme,
            year: it.year,
            pieces: it.pieces,
            imageUrl: it.imageUrl,
            notes: it.notes,
            autoEvaluate: it.autoEvaluate,
            entries: it.entries,
            evaluations: it.evaluations,
          },
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
          width: "min(760px, 96vw)",
          marginTop: "5vh",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          textAlign: "left",
          cursor: "auto",
        }}
      >
        <div className="tag solid" style={{ alignSelf: "flex-start" }}>
          {op === "add" ? "Add" : "Edit"} · LEGO item
        </div>

        {error && (
          <div
            className="card card-pad"
            style={{ borderColor: "var(--red)", color: "var(--red)" }}
          >
            {error}
          </div>
        )}

        {/* Item fields */}
        <div style={row3}>
          <Text
            label="Name"
            value={it.name}
            onChange={(v) => set("name", v)}
            disabled={pending}
          />
          <Text
            label="Set / minifig number"
            value={it.legoRef}
            onChange={(v) => set("legoRef", v)}
            disabled={pending}
          />
          <Select
            label="Type"
            value={it.type}
            options={TYPE_OPTS}
            onChange={(v) => set("type", v as ItemEditData["type"])}
            disabled={pending}
          />
          <Select
            label="Subtheme"
            value={it.subtheme}
            options={SUBTHEME_OPTS}
            onChange={(v) => set("subtheme", v as ItemEditData["subtheme"])}
            disabled={pending}
          />
          <Num
            label="Year"
            value={it.year}
            onChange={(v) => set("year", v)}
            disabled={pending}
          />
          <Num
            label="Pieces"
            value={it.pieces}
            onChange={(v) => set("pieces", v)}
            disabled={pending}
          />
        </div>
        <Text
          label="Image URL"
          value={it.imageUrl}
          onChange={(v) => set("imageUrl", v)}
          disabled={pending}
        />
        <Field label="Notes">
          <textarea
            className="ipt"
            rows={2}
            value={it.notes}
            maxLength={2000}
            disabled={pending}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
        <Check
          label="Auto-refresh BrickEconomy value (off = manual valuation)"
          checked={it.autoEvaluate}
          onChange={(v) => set("autoEvaluate", v)}
          disabled={pending}
        />

        {/* Entries (one per owned copy) */}
        <div>
          <p className="eyebrow line" style={{ margin: "4px 0 12px" }}>
            Copies ({it.entries.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {it.entries.map((e, i) => (
              <div
                key={e.id || `new-${i}`}
                className="card card-pad"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={row3}>
                  <Select
                    label="Condition"
                    value={e.condition}
                    options={CONDITION_OPTS}
                    onChange={(v) =>
                      setEntry(i, { condition: v as EditEntry["condition"] })
                    }
                    disabled={pending}
                  />
                  <Select
                    label="Location"
                    value={e.location}
                    options={LOCATION_OPTS}
                    onChange={(v) =>
                      setEntry(i, { location: v as EditEntry["location"] })
                    }
                    disabled={pending}
                  />
                  <Select
                    label="Status"
                    value={e.disposition}
                    options={DISPOSITION_OPTS}
                    onChange={(v) =>
                      setEntry(i, {
                        disposition: v as EditEntry["disposition"],
                      })
                    }
                    disabled={pending}
                  />
                </div>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                  <Check
                    label="Built"
                    checked={e.isBuild}
                    onChange={(v) => setEntry(i, { isBuild: v })}
                    disabled={pending}
                  />
                  <Check
                    label="Built w/o figs"
                    checked={e.isBuildWOFigs}
                    onChange={(v) => setEntry(i, { isBuildWOFigs: v })}
                    disabled={pending}
                  />
                  <Check
                    label="Crack / damaged"
                    checked={e.isCrack}
                    onChange={(v) => setEntry(i, { isCrack: v })}
                    disabled={pending}
                  />
                </div>
                <div style={row3}>
                  <Num
                    label="Cost / paid"
                    value={e.costPrice}
                    onChange={(v) => setEntry(i, { costPrice: v })}
                    disabled={pending}
                  />
                  <Num
                    label="Store display"
                    value={e.displayPrice}
                    onChange={(v) => setEntry(i, { displayPrice: v })}
                    disabled={pending}
                  />
                  <Num
                    label="Sold price"
                    value={e.sellPrice}
                    onChange={(v) => setEntry(i, { sellPrice: v })}
                    disabled={pending}
                  />
                </div>
                <button
                  type="button"
                  className="mono-sm"
                  style={{
                    alignSelf: "flex-start",
                    color: "var(--red)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  disabled={pending}
                  onClick={() =>
                    set(
                      "entries",
                      it.entries.filter((_, j) => j !== i),
                    )
                  }
                >
                  Remove copy
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginTop: 12 }}
            disabled={pending}
            onClick={() => set("entries", [...it.entries, newEntry()])}
          >
            + Add copy
          </button>
        </div>

        {/* Evaluations (one per price source) */}
        <div>
          <p className="eyebrow line" style={{ margin: "4px 0 12px" }}>
            Price sources ({it.evaluations.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {it.evaluations.map((v, i) => (
              <div
                key={v.id || `new-${i}`}
                className="card card-pad"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div style={row3}>
                  <Select
                    label="Source"
                    value={v.source}
                    options={SOURCE_OPTS}
                    onChange={(s) =>
                      setEval(i, { source: s as EditEvaluation["source"] })
                    }
                    disabled={pending}
                  />
                  <Num
                    label="Value"
                    value={v.value}
                    onChange={(n) => setEval(i, { value: n })}
                    disabled={pending}
                  />
                  <Num
                    label="Retail"
                    value={v.retail}
                    onChange={(n) => setEval(i, { retail: n })}
                    disabled={pending}
                  />
                  <Num
                    label="Low value"
                    value={v.valueLow}
                    onChange={(n) => setEval(i, { valueLow: n })}
                    disabled={pending}
                  />
                  <Num
                    label="High value"
                    value={v.valueHigh}
                    onChange={(n) => setEval(i, { valueHigh: n })}
                    disabled={pending}
                  />
                </div>
                <Text
                  label="Note"
                  value={v.note}
                  onChange={(s) => setEval(i, { note: s })}
                  disabled={pending}
                />
                <button
                  type="button"
                  className="mono-sm"
                  style={{
                    alignSelf: "flex-start",
                    color: "var(--red)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  disabled={pending}
                  onClick={() =>
                    set(
                      "evaluations",
                      it.evaluations.filter((_, j) => j !== i),
                    )
                  }
                >
                  Remove source
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginTop: 12 }}
            disabled={pending}
            onClick={() => set("evaluations", [...it.evaluations, newEval()])}
          >
            + Add price source
          </button>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!valid || pending}
            onClick={save}
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

// ── Public entry points ───────────────────────────────────────────────────────

/** Per-item Edit / Delete controls, shown only to admins. */
export function CollectionAdminControls({ item }: { item: ItemEditData }) {
  const isAdmin = useAdmin();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!isAdmin) return null;

  const remove = () => {
    setError(null);
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    start(async () => {
      try {
        const res = await applyAdminContentChange({
          type: "legoset",
          op: "remove",
          targetId: item.id,
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
    <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
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
        onClick={remove}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && (
        <span className="mono-sm" style={{ color: "var(--red)" }}>
          {error}
        </span>
      )}
      {editing && (
        <Editor op="edit" initial={item} onClose={() => setEditing(false)} />
      )}
    </span>
  );
}

/** "+ Add item" button shown to admins; opens the editor in add mode. */
export function CollectionAddButton({
  className = "btn btn-primary",
}: {
  className?: string;
}) {
  const isAdmin = useAdmin();
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        + Add item
      </button>
      {open && (
        <Editor op="add" initial={emptyItem()} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
