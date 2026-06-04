import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap-wide">
        <div className="footer-top">
          <div>
            <span
              className="mark"
              style={{
                fontFamily: "var(--serif)",
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              Reckless<b style={{ color: "var(--blue)" }}>Bricks</b>
            </span>
            <p className="disclaim" style={{ marginTop: 16 }}>
              An independent archive of the Bricks and Minifigs / Reckless Ben
              controversy. This archive collects publicly available material for
              reference and does not endorse any party. Dates marked approximate
              should be verified against original sources.
            </p>
          </div>
          <div>
            <h4>Archive</h4>
            <ul>
              <li>
                <Link href="/timeline">Timeline</Link>
              </li>
              <li>
                <Link href="/videos">Videos</Link>
              </li>
              <li>
                <Link href="/bodycam">Bodycam footage</Link>
              </li>
              <li>
                <Link href="/documents">Documents</Link>
              </li>
              <li>
                <Link href="/social">Social media</Link>
              </li>
              <li>
                <Link href="/people">People involved</Link>
              </li>
              <li>
                <Link href="/contributors">Contributors</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>About</h4>
            <ul>
              <li>
                <span style={{ fontSize: 14, color: "var(--tx-2)" }}>
                  Disclaimer
                </span>
              </li>
              <li>
                <span style={{ fontSize: 14, color: "var(--tx-2)" }}>
                  Sources &amp; methodology
                </span>
              </li>
              <li>
                <span style={{ fontSize: 14, color: "var(--tx-2)" }}>
                  Corrections policy
                </span>
              </li>
              <li>
                <span style={{ fontSize: 14, color: "var(--tx-2)" }}>
                  Privacy policy
                </span>
              </li>
              <li>
                <span style={{ fontSize: 14, color: "var(--tx-2)" }}>
                  Contact
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4>Follow the case</h4>
            <ul>
              <li>
                <a
                  href="https://www.youtube.com/@RecklessBen"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14 }}
                >
                  Reckless Ben (YouTube) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://www.gofundme.com/f/help-bryan-recover-his-lego-collection"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14 }}
                >
                  GoFundMe for Bryan ↗
                </a>
              </li>
              <li>
                <a
                  href="https://westealfromoldpeople.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14 }}
                >
                  We Steal From Old People ↗
                </a>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Bricks_%26_Minifigs%E2%80%93Reckless_Ben_controversy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 14 }}
                >
                  Wikipedia article ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="copy">
            © 2025 RecklessBricks Archive · Independent case documentation
          </span>
          <span className="mono-sm">
            Not affiliated with any party in this case
          </span>
        </div>
      </div>
    </footer>
  );
}
