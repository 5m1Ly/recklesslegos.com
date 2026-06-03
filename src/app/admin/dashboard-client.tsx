"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { actionErrorMessage } from "@/lib/stale-action";
import { fmtDate, REF_TYPES, type RefOption, type RefType } from "@/lib/types";
import {
  addAdmin,
  adminLogout,
  type DecisionEdits,
  decideSubmission,
  removeAdmin,
} from "./actions";

type Op = "add" | "edit" | "remove";
type Ref = { refType: RefType; refId: string };

interface EntrySnapshot {
  date: string;
  title: string;
  description: string;
  ongoing: boolean;
  refs: Ref[];
}

export interface PendingSubmission {
  id: string;
  op: Op;
  targetId: string | null;
  date: string;
  title: string;
  description: string;
  ongoing: boolean;
  refs: Ref[];
  email: string;
  wantsUpdates: boolean;
  createdAt: string;
  target: EntrySnapshot | null;
}

interface Props {
  pending: PendingSubmission[];
  admins: string[];
  currentAdmin: string;
  refOptions: RefOption[];
}

const OP_LABEL: Record<Op, string> = {
  add: "Add event",
  edit: "Edit event",
  remove: "Remove event",
};

export function DashboardClient({
  pending,
  admins,
  currentAdmin,
  refOptions,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const optByKey = useMemo(() => {
    const m = new Map<string, RefOption>();
    for (const o of refOptions) m.set(`${o.refType}:${o.refId}`, o);
    return m;
  }, [refOptions]);
  const refLabel = (r: Ref) =>
    optByKey.get(`${r.refType}:${r.refId}`)?.label ?? r.refId;

  const logout = () =>
    startTransition(async () => {
      try {
        await adminLogout();
      } catch {
        // Even if the action errors (e.g. stale build), clear the local view.
      }
      router.push("/");
      router.refresh();
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="mono-sm">
          {pending.length} pending submission{pending.length === 1 ? "" : "s"}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="card card-pad">
          <p className="body-txt" style={{ margin: 0 }}>
            Nothing to review right now.
          </p>
        </div>
      ) : (
        pending.map((s) => (
          <SubmissionCard
            key={s.id}
            sub={s}
            refOptions={refOptions}
            refLabel={refLabel}
            onDone={() => router.refresh()}
          />
        ))
      )}

      <AdminsPanel
        admins={admins}
        currentAdmin={currentAdmin}
        onChanged={() => router.refresh()}
      />
    </div>
  );
}

function SubmissionCard({
  sub,
  refOptions,
  refLabel,
  onDone,
}: {
  sub: PendingSubmission;
  refOptions: RefOption[];
  refLabel: (r: Ref) => string;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [modifying, setModifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Editable copy for modify+accept.
  const [date, setDate] = useState(sub.date);
  const [title, setTitle] = useState(sub.title);
  const [description, setDescription] = useState(sub.description);
  const [ongoing, setOngoing] = useState(sub.ongoing);
  const [refs, setRefs] = useState<Ref[]>(sub.refs);

  const run = (action: "accept" | "modify_accept" | "reject") => {
    setError(null);
    const edits: DecisionEdits | null =
      action === "modify_accept"
        ? { date, title, description, ongoing, refs }
        : null;
    startTransition(async () => {
      try {
        const res = await decideSubmission(sub.id, action, edits, note || null);
        if (!res.ok) {
          setError(res.error ?? "Something went wrong.");
          return;
        }
        onDone();
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  return (
    <div
      className="card card-pad"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span className="tag solid">{OP_LABEL[sub.op]}</span>
        <span className="mono-sm">from {sub.email}</span>
        {sub.wantsUpdates && (
          <span className="tag social">
            <span className="dot" />
            wants updates
          </span>
        )}
      </div>

      {/* Target (current) state for edit/remove */}
      {sub.op !== "add" && sub.target && (
        <div>
          <span className="mono-label">Current</span>
          <EntryPreview entry={sub.target} refLabel={refLabel} muted />
        </div>
      )}

      {/* Proposed state for add/edit */}
      {sub.op !== "remove" && (
        <div>
          <span className="mono-label">
            {sub.op === "edit" ? "Proposed changes" : "Proposed"}
          </span>
          {!modifying ? (
            <EntryPreview
              entry={{
                date: sub.date,
                title: sub.title,
                description: sub.description,
                ongoing: sub.ongoing,
                refs: sub.refs,
              }}
              refLabel={refLabel}
            />
          ) : (
            <ModifyForm
              date={date}
              title={title}
              description={description}
              ongoing={ongoing}
              refs={refs}
              refOptions={refOptions}
              refLabel={refLabel}
              setDate={setDate}
              setTitle={setTitle}
              setDescription={setDescription}
              setOngoing={setOngoing}
              setRefs={setRefs}
            />
          )}
        </div>
      )}

      {error && <p style={{ color: "var(--red)", margin: 0 }}>{error}</p>}

      <label style={{ display: "block" }}>
        <span className="mono-label">Note to contributor (optional)</span>
        <div style={{ marginTop: 6 }}>
          <textarea
            className="ipt"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Included in the update email, if they opted in."
          />
        </div>
      </label>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {sub.op !== "remove" &&
          (!modifying ? (
            <button
              type="button"
              className="btn"
              disabled={pending}
              onClick={() => setModifying(true)}
            >
              Modify…
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary"
                disabled={pending}
                onClick={() => run("modify_accept")}
              >
                {pending ? "Saving…" : "Save changes & publish"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={pending}
                onClick={() => setModifying(false)}
              >
                Cancel edit
              </button>
            </>
          ))}
        {!modifying && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() => run("accept")}
          >
            {pending
              ? "Working…"
              : sub.op === "remove"
                ? "Approve removal"
                : "Accept"}
          </button>
        )}
        {!modifying && (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pending}
            onClick={() => run("reject")}
            style={{ color: "var(--red)" }}
          >
            Reject
          </button>
        )}
      </div>
    </div>
  );
}

function EntryPreview({
  entry,
  refLabel,
  muted = false,
}: {
  entry: EntrySnapshot;
  refLabel: (r: Ref) => string;
  muted?: boolean;
}) {
  return (
    <div
      className="card"
      style={{ padding: "12px 14px", marginTop: 6, opacity: muted ? 0.7 : 1 }}
    >
      <div className="mono-sm">
        {entry.date ? fmtDate(entry.date) : "—"}
        {entry.ongoing ? " · ongoing" : ""}
      </div>
      <div style={{ fontWeight: 600, margin: "4px 0" }}>
        {entry.title || "—"}
      </div>
      <p className="body-txt" style={{ margin: "0 0 8px" }}>
        {entry.description}
      </p>
      {entry.refs.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {entry.refs.map((r) => (
            <span key={`${r.refType}:${r.refId}`} className="chip">
              {REF_TYPES[r.refType].label}: {refLabel(r)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ModifyForm({
  date,
  title,
  description,
  ongoing,
  refs,
  refOptions,
  refLabel,
  setDate,
  setTitle,
  setDescription,
  setOngoing,
  setRefs,
}: {
  date: string;
  title: string;
  description: string;
  ongoing: boolean;
  refs: Ref[];
  refOptions: RefOption[];
  refLabel: (r: Ref) => string;
  setDate: (v: string) => void;
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setOngoing: (v: boolean) => void;
  setRefs: (updater: (prev: Ref[]) => Ref[]) => void;
}) {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<RefType | "all">("all");
  const selectedKeys = useMemo(
    () => new Set(refs.map((r) => `${r.refType}:${r.refId}`)),
    [refs],
  );
  const options = useMemo(() => {
    const t = q.trim().toLowerCase();
    return refOptions
      .filter((o) => typeFilter === "all" || o.refType === typeFilter)
      .filter(
        (o) =>
          !t ||
          o.label.toLowerCase().includes(t) ||
          o.meta.toLowerCase().includes(t),
      )
      .slice(0, 30);
  }, [refOptions, q, typeFilter]);

  const toggle = (o: RefOption) => {
    const key = `${o.refType}:${o.refId}`;
    setRefs((prev) =>
      selectedKeys.has(key)
        ? prev.filter((r) => `${r.refType}:${r.refId}` !== key)
        : [...prev, { refType: o.refType, refId: o.refId }],
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginTop: 6,
      }}
    >
      <input
        type="date"
        className="ipt"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="text"
        className="ipt"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      <textarea
        className="ipt"
        rows={3}
        value={description}
        maxLength={2000}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
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
          checked={ongoing}
          onChange={(e) => setOngoing(e.target.checked)}
        />
        <span className="body-txt" style={{ margin: 0 }}>
          Ongoing
        </span>
      </label>

      {refs.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {refs.map((r) => (
            <button
              key={`${r.refType}:${r.refId}`}
              type="button"
              className="chip on"
              onClick={() =>
                setRefs((prev) =>
                  prev.filter(
                    (x) =>
                      `${x.refType}:${x.refId}` !== `${r.refType}:${r.refId}`,
                  ),
                )
              }
            >
              {REF_TYPES[r.refType].label}: {refLabel(r)} ✕
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          className={`chip ${typeFilter === "all" ? "on" : ""}`}
          onClick={() => setTypeFilter("all")}
        >
          All
        </button>
        {(Object.keys(REF_TYPES) as RefType[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`chip ${typeFilter === t ? "on" : ""}`}
            onClick={() => setTypeFilter(t)}
          >
            {REF_TYPES[t].plural}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="ipt"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search references…"
      />
      <div
        style={{
          maxHeight: 200,
          overflowY: "auto",
          border: "1px solid var(--line)",
          borderRadius: 8,
        }}
      >
        {options.map((o) => {
          const selected = selectedKeys.has(`${o.refType}:${o.refId}`);
          return (
            <button
              key={`${o.refType}:${o.refId}`}
              type="button"
              onClick={() => toggle(o)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                borderBottom: "1px solid var(--line)",
                background: selected ? "rgba(0,90,255,0.06)" : "transparent",
                cursor: "pointer",
              }}
            >
              <span className="mono-sm">{REF_TYPES[o.refType].label}</span>{" "}
              <span style={{ fontWeight: 500 }}>{o.label}</span>
              {selected && <span className="mono-sm"> · selected</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AdminsPanel({
  admins,
  currentAdmin,
  onChanged,
}: {
  admins: string[];
  currentAdmin: string;
  onChanged: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const add = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await addAdmin(email);
        if (!res.ok) {
          setError(res.error ?? "Couldn't add admin.");
          return;
        }
        setEmail("");
        onChanged();
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  const remove = (target: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await removeAdmin(target);
        if (!res.ok) {
          setError(res.error ?? "Couldn't remove admin.");
          return;
        }
        onChanged();
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  return (
    <div
      className="card card-pad"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <h3 className="h-card" style={{ margin: 0 }}>
        Admins
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {admins.map((a) => (
          <div
            key={a}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span className="body-txt" style={{ margin: 0 }}>
              {a}
              {a === currentAdmin && <span className="mono-sm"> · you</span>}
            </span>
            {a !== currentAdmin && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={pending}
                onClick={() => remove(a)}
                style={{ color: "var(--red)" }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {error && <p style={{ color: "var(--red)", margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          type="email"
          className="ipt"
          style={{ flex: 1, minWidth: 220 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="new-admin@example.com"
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending || !email}
          onClick={add}
        >
          Add admin
        </button>
      </div>
    </div>
  );
}
