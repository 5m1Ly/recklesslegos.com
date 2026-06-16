"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  attachContributorSession,
  getConsentStatus,
  getContributorSession,
  logoutContributor,
  recordConsent,
} from "@/app/propose/actions";
import { useAdmin } from "@/components/admin-provider";
import { actionErrorMessage } from "@/lib/stale-action";
import {
  fmtDate,
  REF_TYPES,
  type RefOption,
  type RefType,
  type SubmissionOp,
} from "@/lib/types";
import {
  applyAdminTimelineChange,
  finalizeSubmission,
  sendContribCode,
  startSubmission,
  verifyContribCode,
} from "./actions";

export interface InitialEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  ongoing: boolean;
  refs: { refType: RefType; refId: string }[];
}

interface Props {
  op: SubmissionOp;
  initial: InitialEntry | null;
  refOptions: RefOption[];
}

type Step = "compose" | "verify" | "done";
type SelectedRef = { refType: RefType; refId: string };

const OP_LABELS: Record<SubmissionOp, string> = {
  add: "Add a new event",
  edit: "Edit this event",
  remove: "Propose removal",
};

export function ContributeClient({ op, initial, refOptions }: Props) {
  const isAdmin = useAdmin();
  const [step, setStep] = useState<Step>("compose");
  const [date, setDate] = useState(initial?.date ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [ongoing, setOngoing] = useState(initial?.ongoing ?? false);
  const [refs, setRefs] = useState<SelectedRef[]>(initial?.refs ?? []);
  const [refQuery, setRefQuery] = useState("");
  const [refTypeFilter, setRefTypeFilter] = useState<RefType | "all">("all");

  const [email, setEmail] = useState("");
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);

  // Consent (only asked when the email isn't already on file).
  const [consentOnFile, setConsentOnFile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [consentStore, setConsentStore] = useState(false);
  const [consentList, setConsentList] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Existing contributor login (set once they've verified an email before).
  // When present we skip the email-code step for any add/edit/remove.
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  useEffect(() => {
    getContributorSession().then((s) => setSessionEmail(s?.email ?? null));
  }, []);

  const optByKey = useMemo(() => {
    const m = new Map<string, RefOption>();
    for (const o of refOptions) m.set(`${o.refType}:${o.refId}`, o);
    return m;
  }, [refOptions]);

  const refLabel = (r: SelectedRef) =>
    optByKey.get(`${r.refType}:${r.refId}`)?.label ?? r.refId;

  const isRemove = op === "remove";

  const selectedKeys = useMemo(
    () => new Set(refs.map((r) => `${r.refType}:${r.refId}`)),
    [refs],
  );

  const filteredOptions = useMemo(() => {
    const q = refQuery.trim().toLowerCase();
    return refOptions
      .filter((o) => refTypeFilter === "all" || o.refType === refTypeFilter)
      .filter(
        (o) =>
          !q ||
          o.label.toLowerCase().includes(q) ||
          o.meta.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [refOptions, refQuery, refTypeFilter]);

  const toggleRef = (o: RefOption) => {
    const key = `${o.refType}:${o.refId}`;
    setRefs((prev) =>
      selectedKeys.has(key)
        ? prev.filter((r) => `${r.refType}:${r.refId}` !== key)
        : [...prev, { refType: o.refType, refId: o.refId }],
    );
  };

  const composeValid = isRemove
    ? !!initial
    : date.trim() !== "" && title.trim() !== "" && description.trim() !== "";

  // ── Step transitions ────────────────────────────────────────────────────

  // Admins skip the email-verification + moderation flow entirely: the change
  // is applied to the timeline immediately.
  const handleAdminPublish = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await applyAdminTimelineChange({
          op,
          targetId: initial?.id ?? null,
          date,
          title,
          description,
          ongoing,
          refs,
        });
        if (!res.ok) {
          setError(res.error ?? "Couldn't publish the change.");
          return;
        }
        setStep("done");
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  const handleContinue = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await startSubmission({
          op,
          targetId: initial?.id ?? null,
          date,
          title,
          description,
          ongoing,
          refs,
        });
        if (!res.ok || !res.submissionId) {
          setError(res.error ?? "Something went wrong.");
          return;
        }
        setSubmissionId(res.submissionId);
        // Already logged in → no email/code needed; jump straight to submit.
        if (sessionEmail) {
          const status = await getConsentStatus(sessionEmail);
          setConsentOnFile(status.onFile);
          setVerified(true);
        }
        setStep("verify");
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  const handleSendCode = () => {
    setError(null);
    setNotice(null);
    if (!submissionId) return;
    startTransition(async () => {
      try {
        const status = await getConsentStatus(email);
        setConsentOnFile(status.onFile);
        const res = await sendContribCode(submissionId, email, wantsUpdates);
        if (!res.ok) {
          setError(res.error ?? "Couldn't send the code.");
          return;
        }
        setCodeSent(true);
        setNotice(`We sent a 6-digit code to ${email}. Enter it below.`);
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  const handleVerifyCode = () => {
    setError(null);
    if (!submissionId) return;
    startTransition(async () => {
      try {
        const res = await verifyContribCode(submissionId, code);
        if (!res.ok) {
          setError(res.error ?? "Couldn't verify the code.");
          return;
        }
        setVerified(true);
        setNotice("Email verified. You can now submit your change.");
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  const handleSubmit = () => {
    setError(null);
    if (!submissionId) return;
    startTransition(async () => {
      try {
        if (sessionEmail) {
          const att = await attachContributorSession({
            submissionId,
            wantsUpdates,
          });
          if (!att.ok) {
            setError(att.error ?? "Couldn't submit.");
            return;
          }
        }
        if (!consentOnFile) {
          const cr = await recordConsent({
            submissionId,
            displayName,
            consentStoreEmail: consentStore,
            consentListPublicly: consentList,
          });
          if (!cr.ok) {
            setError(cr.error ?? "Couldn't record your choices.");
            return;
          }
        }
        const res = await finalizeSubmission(submissionId);
        if (!res.ok) {
          setError(res.error ?? "Couldn't submit.");
          return;
        }
        setStep("done");
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutContributor();
      setSessionEmail(null);
      setVerified(false);
      setCodeSent(false);
      setNotice(null);
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div className="card card-pad">
        <h3 className="h-card" style={{ marginBottom: 10 }}>
          {isAdmin ? "Change published ✓" : "Submitted for review ✓"}
        </h3>
        <p className="body-txt" style={{ margin: "0 0 16px" }}>
          {isAdmin ? (
            "Your change is now live on the timeline."
          ) : (
            <>
              Thanks — your proposed change is now in the moderation queue. A
              moderator will review it before it appears on the timeline.
              {wantsUpdates
                ? " Because you opted in, we'll email you when it's decided."
                : ""}
            </>
          )}
        </p>
        <Link href="/timeline" className="btn btn-primary">
          Back to the timeline
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="tag solid" style={{ alignSelf: "flex-start" }}>
        {OP_LABELS[op]}
      </div>

      {error && (
        <div
          className="card card-pad"
          style={{ borderColor: "var(--red)", color: "var(--red)" }}
        >
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="card card-pad" style={{ borderColor: "var(--blue)" }}>
          {notice}
        </div>
      )}

      {step === "compose" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {isRemove ? (
            <div className="card card-pad">
              <span className="mono-label">You are proposing to remove</span>
              <h3 className="h-card" style={{ margin: "8px 0 6px" }}>
                {initial?.title}
              </h3>
              <p className="mono-sm" style={{ margin: 0 }}>
                {initial ? fmtDate(initial.date) : ""}
              </p>
              <p className="body-txt" style={{ margin: "10px 0 0" }}>
                {initial?.description}
              </p>
            </div>
          ) : (
            <>
              <Field label="Date" hint="Required · format YYYY-MM-DD">
                <input
                  type="date"
                  className="ipt"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <Field label="Title" hint="Required">
                <input
                  type="text"
                  className="ipt"
                  value={title}
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short headline for this event"
                />
              </Field>
              <Field label="Description" hint="Required">
                <textarea
                  className="ipt"
                  rows={4}
                  value={description}
                  maxLength={2000}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened, and why it matters."
                />
              </Field>
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
                  Mark as ongoing
                </span>
              </label>

              <div>
                <span className="mono-label">References (optional)</span>
                <p className="mono-sm" style={{ margin: "4px 0 10px" }}>
                  Link existing videos, bodycam, documents, social posts, or
                  people. You can add more than one.
                </p>

                {refs.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 7,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    {refs.map((r) => (
                      <button
                        key={`${r.refType}:${r.refId}`}
                        type="button"
                        className="chip on"
                        onClick={() =>
                          setRefs((prev) =>
                            prev.filter(
                              (x) =>
                                `${x.refType}:${x.refId}` !==
                                `${r.refType}:${r.refId}`,
                            ),
                          )
                        }
                      >
                        {REF_TYPES[r.refType].label}: {refLabel(r)} ✕
                      </button>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  <button
                    type="button"
                    className={`chip ${refTypeFilter === "all" ? "on" : ""}`}
                    onClick={() => setRefTypeFilter("all")}
                  >
                    All
                  </button>
                  {(Object.keys(REF_TYPES) as RefType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`chip ${refTypeFilter === t ? "on" : ""}`}
                      onClick={() => setRefTypeFilter(t)}
                    >
                      {REF_TYPES[t].plural}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="ipt"
                  value={refQuery}
                  onChange={(e) => setRefQuery(e.target.value)}
                  placeholder="Search references…"
                  style={{ marginBottom: 10 }}
                />
                <div
                  style={{
                    maxHeight: 260,
                    overflowY: "auto",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                  }}
                >
                  {filteredOptions.length === 0 ? (
                    <p className="mono-sm" style={{ padding: 14, margin: 0 }}>
                      No matches.
                    </p>
                  ) : (
                    filteredOptions.map((o) => {
                      const selected = selectedKeys.has(
                        `${o.refType}:${o.refId}`,
                      );
                      return (
                        <button
                          key={`${o.refType}:${o.refId}`}
                          type="button"
                          onClick={() => toggleRef(o)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--line)",
                            background: selected
                              ? "var(--blue-tint, rgba(0,90,255,0.06))"
                              : "transparent",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "baseline",
                            }}
                          >
                            <span className="mono-sm">
                              {REF_TYPES[o.refType].label}
                            </span>
                            <span style={{ fontWeight: 500 }}>{o.label}</span>
                            {selected && (
                              <span className="mono-sm">· selected</span>
                            )}
                          </div>
                          <div className="mono-sm" style={{ marginTop: 2 }}>
                            {o.meta}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!composeValid || pending}
              onClick={isAdmin ? handleAdminPublish : handleContinue}
            >
              {pending
                ? isAdmin
                  ? "Publishing…"
                  : "Saving…"
                : isAdmin
                  ? isRemove
                    ? "Delete event"
                    : "Publish"
                  : "Save & continue"}
            </button>
            <Link href="/timeline" className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      )}

      {step === "verify" && sessionEmail && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            className="card card-pad"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span className="body-txt" style={{ margin: 0 }}>
              Signed in as <strong>{sessionEmail}</strong>
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pending}
              onClick={handleLogout}
            >
              Use a different email
            </button>
          </div>

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
              checked={wantsUpdates}
              onChange={(e) => setWantsUpdates(e.target.checked)}
            />
            <span className="body-txt" style={{ margin: 0 }}>
              Email me updates about my published content (when it's accepted,
              edited, or rejected).
            </span>
          </label>

          {!consentOnFile && (
            <div
              className="card card-pad"
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <span className="mono-label">Before you submit</span>
              <Field
                label="Display name"
                hint="Optional · shown if you choose to be listed"
              >
                <input
                  type="text"
                  className="ipt"
                  value={displayName}
                  maxLength={80}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you'd like to be credited"
                />
              </Field>
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={consentStore}
                  onChange={(e) => setConsentStore(e.target.checked)}
                />
                <span className="body-txt" style={{ margin: 0 }}>
                  You may store my email address in your database. If unchecked,
                  we only use it to verify and notify you, then delete it once a
                  moderator decides.
                </span>
              </label>
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={consentList}
                  onChange={(e) => setConsentList(e.target.checked)}
                />
                <span className="body-txt" style={{ margin: 0 }}>
                  List me publicly on the contributors page (shown as your
                  display name and a redacted email).
                </span>
              </label>
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending}
              onClick={handleSubmit}
            >
              {pending ? "Submitting…" : "Submit for review"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => setStep("compose")}
            >
              Back
            </button>
          </div>
        </div>
      )}

      {step === "verify" && !sessionEmail && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Field label="Your email" hint="Required to submit a change">
            <input
              type="email"
              className="ipt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={codeSent}
              placeholder="you@example.com"
            />
          </Field>

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
              checked={wantsUpdates}
              onChange={(e) => setWantsUpdates(e.target.checked)}
              disabled={codeSent}
            />
            <span className="body-txt" style={{ margin: 0 }}>
              Email me updates about my published content (when it's accepted,
              edited, or rejected).
            </span>
          </label>

          {!codeSent ? (
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={pending || !email}
                onClick={handleSendCode}
              >
                {pending ? "Sending…" : "Verify email"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setStep("compose")}
              >
                Back
              </button>
            </div>
          ) : (
            <>
              <Field label="6-digit code" hint="Check your email">
                <input
                  type="text"
                  inputMode="numeric"
                  className="ipt"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  disabled={verified}
                  placeholder="000000"
                  style={{ letterSpacing: 6, fontFamily: "var(--mono)" }}
                />
              </Field>
              {verified && !consentOnFile && (
                <div
                  className="card card-pad"
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <span className="mono-label">Before you submit</span>
                  <Field
                    label="Display name"
                    hint="Optional · shown if you choose to be listed"
                  >
                    <input
                      type="text"
                      className="ipt"
                      value={displayName}
                      maxLength={80}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How you'd like to be credited"
                    />
                  </Field>
                  <label
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={consentStore}
                      onChange={(e) => setConsentStore(e.target.checked)}
                    />
                    <span className="body-txt" style={{ margin: 0 }}>
                      You may store my email address in your database. If
                      unchecked, we only use it to verify and notify you, then
                      delete it once a moderator decides.
                    </span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={consentList}
                      onChange={(e) => setConsentList(e.target.checked)}
                    />
                    <span className="body-txt" style={{ margin: 0 }}>
                      List me publicly on the contributors page (shown as your
                      display name and a redacted email).
                    </span>
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {!verified && (
                  <button
                    type="button"
                    className="btn"
                    disabled={pending || code.length !== 6}
                    onClick={handleVerifyCode}
                  >
                    {pending ? "Checking…" : "Verify code"}
                  </button>
                )}
                {!verified && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={pending}
                    onClick={handleSendCode}
                  >
                    Resend code
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!verified || pending}
                  onClick={handleSubmit}
                >
                  {pending ? "Submitting…" : "Submit for review"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Field({
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
