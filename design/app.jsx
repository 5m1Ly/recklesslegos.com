/* ============================================================
   THROUGHLINE — App router
   ============================================================ */

function TimelinePage({ go }) {
  return (
    <div>
      <PageHead
        crumb={
          <span>
            <a onClick={() => go("home")} style={{ cursor: "pointer" }}>
              Home
            </a>{" "}
            / Timeline
          </span>
        }
        title="Case timeline"
        sub="Every event in the record, in chronological order. Filter by category, search, and expand any event to see its linked videos, documents, bodycam files, social posts, and the people involved."
      />
      <div className="wrap-wide section-sm" style={{ paddingTop: 8 }}>
        <TimelineView go={go} />
      </div>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(
    () => location.hash.replace("#", "") || "home",
  );
  const [search, setSearch] = useState(false);

  const go = (r) => {
    setRoute(r);
    history.replaceState(null, "", "#" + r);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  useEffect(() => {
    const onHash = () => setRoute(location.hash.replace("#", "") || "home");
    window.addEventListener("hashchange", onHash);
    const onKey = (e) => {
      if (
        e.key === "/" &&
        !/INPUT|TEXTAREA/.test(document.activeElement.tagName)
      ) {
        e.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  let page;
  if (route.startsWith("person:"))
    page = <PersonProfile id={route.split(":")[1]} go={go} />;
  else
    switch (route) {
      case "timeline":
        page = <TimelinePage go={go} />;
        break;
      case "videos":
        page = <VideosPage go={go} />;
        break;
      case "bodycam":
        page = <BodycamPage go={go} />;
        break;
      case "documents":
        page = <DocumentsPage go={go} />;
        break;
      case "social":
        page = <SocialPage go={go} />;
        break;
      case "people":
        page = <PeoplePage go={go} />;
        break;
      default:
        page = <HomePage go={go} onSearch={() => setSearch(true)} />;
    }

  const navRoute = route.startsWith("person:") ? "people" : route;

  return (
    <div>
      <Nav route={navRoute} go={go} onSearch={() => setSearch(true)} />
      {page}
      <Footer go={go} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} go={go} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
