"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Field, ProposalFields } from "@/components/proposal-form";
import { PROPOSAL_TYPES, type ProposalType } from "@/lib/proposal-types";
import { actionErrorMessage } from "@/lib/stale-action";
import type { SubmissionOp } from "@/lib/types";
import {
  finalizeSubmission,
  sendContribCode,
  verifyContribCode,
} from "../../timeline/contribute/actions";
import {
  getConsentStatus,
  recordConsent,
  startContentSubmission,
} from "../actions";

interface Props {
  type: ProposalType;
  op: SubmissionOp;
  targetId: string | null;
  initial: Record<string, string> | null;
  targetLabel: string | null;
}

const OP_LABELS: Record<SubmissionOp, string> = {
  add: "Propose an addition",
  edit: "Propose an edit",
  remove: "Propose a removal",
};

export function ProposeClient({
  type,
  op,
  targetId,
  initial,
  targetLabel,
}: Props) {
  const def = PROPOSAL_TYPES[type];
  const [step, setStep] = useState<"compose" | "verify" | "done">("compose");
  const [values, setValues] = useState<Record<string, string>>(initial ?? {});

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

  const isRemove = op === "remove";
  const setVal = (k: string, v: string) =>
    setValues((p) => ({ ...p, [k]: v }));

  const composeValid =
    isRemove ||
    def.fields
      .filter((f) => f.required && f.kind !== "boolean")
      .every((f) => (values[f.key] ?? "").trim() !== "");

  const handleContinue = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await startContentSubmission({
          contentType: type,
          op,
          targetId,
          payload: values,
        });
        if (!res.ok || !res.submissionId) {
          setError(res.error ?? "Something went wrong.");
          return;
        }
        setSubmissionId(res.submissionId);
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
        setNotice(
          consentOnFile
            ? "Email verified. You can now submit."
            : "Email verified. A couple of quick questions, then submit.",
        );
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

  if (step === "done") {
    return (
      <div className="card card-pad">
        <h3 className="h-card" style={{ marginBottom: 10 }}>
          Submitted for review ✓
        </h3>
        <p className="body-txt" style={{ margin: "0 0 16px" }}>
          Thanks — your proposed change is now in the moderation queue. A
          moderator will review it before it appears on the site.
          {wantsUpdates
            ? " Because you opted in, we'll email you when it's decided."
            : ""}
        </p>
        <Link href={def.basePath} className="btn btn-primary">
          Back to {def.plural.toLowerCase()}
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="tag solid" style={{ alignSelf: "flex-start" }}>
        {OP_LABELS[op]} · {def.label}
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
              <h3 className="h-card" style={{ margin: "8px 0 0" }}>
                {targetLabel ?? "(item)"}
              </h3>
            </div>
          ) : (
            <ProposalFields
              fields={def.fields}
              values={values}
              onChange={setVal}
            />
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!composeValid || pending}
              onClick={handleContinue}
            >
              {pending ? "Saving…" : "Save & continue"}
            </button>
            <Link href={def.basePath} className="btn btn-ghost">
              Cancel
            </Link>
          </div>
        </div>
      )}

      {step === "verify" && (
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
            style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={wantsUpdates}
              onChange={(e) => setWantsUpdates(e.target.checked)}
              disabled={codeSent}
            />
            <span className="body-txt" style={{ margin: 0 }}>
              Email me updates about this submission (accepted, edited, or
              rejected).
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

              {!verified && (
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={pending || code.length !== 6}
                    onClick={handleVerifyCode}
                  >
                    {pending ? "Checking…" : "Verify code"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={pending}
                    onClick={handleSendCode}
                  >
                    Resend code
                  </button>
                </div>
              )}

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
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
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
                    style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}
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

              <button
                type="button"
                className="btn btn-primary"
                style={{ alignSelf: "flex-start" }}
                disabled={!verified || pending}
                onClick={handleSubmit}
              >
                {pending ? "Submitting…" : "Submit for review"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
