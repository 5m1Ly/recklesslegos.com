"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icons } from "./icons";

const NAV_ITEMS: [string, string][] = [
  ["/", "Home"],
  ["/timeline", "Timeline"],
  ["/videos", "Videos"],
  ["/bodycam", "Bodycam"],
  ["/documents", "Documents"],
  ["/social", "Social"],
  ["/people", "People"],
];

export function Nav() {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);

  return (
    <header className="nav">
      <div className="wrap-wide nav-inner">
        <Link href="/" className="brand">
          {/* biome-ignore lint/performance/noImgElement: small static SVG logo */}
          <img
            src="/recklessbricks-icon.svg"
            alt=""
            className="brand-logo"
            width={26}
            height={26}
          />
          <span className="mark">
            Reckless<b>Bricks</b>
          </span>
        </Link>
        <nav className="nav-links">
          {NAV_ITEMS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="grow" />
        <Link href="/?search=1" className="nav-search">
          <Icons.search />
          <span className="ph-txt">Search the archive…</span>
          <span className="kbd">/</span>
        </Link>
        <div className="cta-group">
          <a
            href="https://www.youtube.com/@RecklessBen"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-yt"
          >
            <Icons.yt /> Reckless Ben
          </a>
          <a
            href="https://www.gofundme.com/f/help-bryan-recover-his-lego-collection"
            target="_blank"
            rel="noopener noreferrer"
            className="cta-gfm"
          >
            <svg
              aria-hidden={true}
              viewBox="0 0 24 24"
              fill="none"
              width={15}
              height={15}
            >
              <path
                d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>{" "}
            GoFundMe
          </a>
        </div>
        <button
          type="button"
          className="btn btn-icon btn-ghost hamburger"
          onClick={() => setMobile((m) => !m)}
          aria-label="Toggle menu"
        >
          {mobile ? <Icons.close /> : <Icons.menu />}
        </button>
      </div>
      {mobile && (
        <div
          className="wrap-wide"
          style={{
            paddingBottom: 18,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {NAV_ITEMS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobile(false)}
              style={{
                padding: "10px 6px",
                color: pathname === href ? "var(--tx-0)" : "var(--tx-2)",
                borderBottom: "1px solid var(--line)",
              }}
            >
              {label}
            </Link>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <a
              href="https://www.youtube.com/@RecklessBen"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-yt"
            >
              <Icons.yt /> Reckless Ben
            </a>
            <a
              href="https://www.gofundme.com/f/help-bryan-recover-his-lego-collection"
              target="_blank"
              rel="noopener noreferrer"
              className="cta-gfm"
            >
              <Icons.heart /> GoFundMe
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
