"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { actionErrorMessage } from "@/lib/stale-action";
import { requestAdminCode, verifyAdminCode } from "../actions";

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const res = await requestAdminCode(email);
        if (!res.ok) {
          setError(res.error ?? "Something went wrong.");
          return;
        }
        setSent(true);
        setNotice(
          "If that email belongs to an admin, a 6-digit code is on its way.",
        );
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  const verify = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await verifyAdminCode(email, code);
        if (!res.ok) {
          setError(res.error ?? "Couldn't verify the code.");
          return;
        }
        router.push("/admin");
        router.refresh();
      } catch (e) {
        setError(actionErrorMessage(e));
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

      <label style={{ display: "block" }}>
        <span className="mono-label">Admin email</span>
        <div style={{ marginTop: 6 }}>
          <input
            type="email"
            className="ipt"
            value={email}
            disabled={sent}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </label>

      {!sent ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={pending || !email}
          onClick={send}
        >
          {pending ? "Sending…" : "Send code"}
        </button>
      ) : (
        <>
          <label style={{ display: "block" }}>
            <span className="mono-label">6-digit code</span>
            <div style={{ marginTop: 6 }}>
              <input
                type="text"
                inputMode="numeric"
                className="ipt"
                value={code}
                maxLength={6}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                style={{ letterSpacing: 6, fontFamily: "var(--mono)" }}
              />
            </div>
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending || code.length !== 6}
              onClick={verify}
            >
              {pending ? "Verifying…" : "Sign in"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pending}
              onClick={send}
            >
              Resend code
            </button>
          </div>
        </>
      )}
    </div>
  );
}
