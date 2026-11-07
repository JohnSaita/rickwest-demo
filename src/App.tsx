import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Polygon } from "geojson";
import { AREAS, BUDGETS, PROJECTS, type Area, type Purpose } from "./data/projects";
import { fetchDriveTimes, fetchIsochrone, fetchNearby, TOKEN, type DriveTime, type Poi, type PoiCategory } from "./lib/api";
import MapView from "./components/MapView";
import ProjectList from "./components/ProjectList";
import ProjectDetail from "./components/ProjectDetail";
import BottomSheet, { type Snap } from "./components/BottomSheet";
import { useIsMobile } from "./lib/useIsMobile";

type Load<T> = { state: "idle" | "loading" | "error" | "ready"; data?: T };
type BudgetId = (typeof BUDGETS)[number]["id"];

export default function App() {
  const isMobile = useIsMobile();
  const [purpose, setPurpose] = useState<Purpose>("sale");
  const [area, setArea] = useState<Area | "All">("All");
  const [budget, setBudget] = useState<BudgetId>("any");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snap>("peek");
  const [sheetPx, setSheetPx] = useState(0);

  const [nearby, setNearby] = useState<Load<Poi[]>>({ state: "idle" });
  const [drives, setDrives] = useState<Load<DriveTime[]>>({ state: "idle" });
  const [iso, setIso] = useState<Load<FeatureCollection<Polygon>>>({ state: "idle" });
  const [showIso, setShowIso] = useState(false);
  const [poiCats, setPoiCats] = useState<Set<PoiCategory>>(new Set(["school", "health", "shopping"]));
  const [nearbyTry, setNearbyTry] = useState(0);

  const filtered = useMemo(() => {
    const b = BUDGETS.find((x) => x.id === budget)!;
    return PROJECTS.filter(
      (p) =>
        p.purpose === purpose &&
        (area === "All" || p.area === area) &&
        (purpose === "rent" || p.fromKES == null || (p.fromKES >= b.min && p.fromKES < b.max)),
    ).sort((a, b) => (a.fromKES ?? 0) - (b.fromKES ?? 0));
  }, [purpose, area, budget]);

  const selected = PROJECTS.find((p) => p.id === selectedId) ?? null;

  const select = (id: string) => {
    setSelectedId(id);
    if (isMobile) setSnap("half");
  };
  const deselect = () => {
    setSelectedId(null);
    if (isMobile) setSnap("peek");
  };

  // Load nearby places and drive times whenever a project is opened.
  useEffect(() => {
    if (!selected) return;
    let live = true;
    setNearby({ state: "loading" });
    setDrives({ state: "loading" });
    setIso({ state: "idle" });
    setShowIso(false);
    fetchNearby(selected.id, selected.coords)
      .then((d) => live && setNearby({ state: "ready", data: d }))
      .catch(() => live && setNearby({ state: "error" }));
    fetchDriveTimes(selected.coords)
      .then((d) => live && setDrives({ state: d.length ? "ready" : "error", data: d }))
      .catch(() => live && setDrives({ state: "error" }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, nearbyTry]);

  // Drive-time areas load only when switched on.
  useEffect(() => {
    if (!selected || !showIso || iso.state !== "idle") return;
    setIso({ state: "loading" });
    fetchIsochrone(selected.coords)
      .then((d) => setIso({ state: "ready", data: d }))
      .catch(() => setIso({ state: "error" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIso, selectedId]);

  // Esc closes the detail panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && deselect();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!TOKEN) {
    return (
      <div className="token-gate">
        <h1>Add your Mapbox token</h1>
        <p>
          Copy <code>.env.example</code> to <code>.env</code> and set <code>VITE_MAPBOX_TOKEN</code> to your public
          <code> pk.</code> token, then restart <code>npm run dev</code>.
        </p>
      </div>
    );
  }

  /* ---------- shared pieces ---------- */

  const purposeToggle = (
    <div className="seg" role="tablist" aria-label="Buy or rent">
      {(["sale", "rent"] as Purpose[]).map((p) => (
        <button
          key={p}
          role="tab"
          aria-selected={purpose === p}
          className={purpose === p ? "on" : ""}
          onClick={() => {
            setPurpose(p);
            deselect();
          }}
        >
          {p === "sale" ? "Buy" : "Rent"}
        </button>
      ))}
    </div>
  );

  const areaChips = (
    <div className="chips" aria-label="Area">
      {(["All", ...AREAS] as const).map((a) => (
        <button
          key={a}
          className={`chip ${area === a ? "on" : ""}`}
          onClick={() => {
            setArea(a);
            deselect();
          }}
        >
          {a}
        </button>
      ))}
    </div>
  );

  const budgetSelect =
    purpose === "sale" ? (
      <select value={budget} onChange={(e) => setBudget(e.target.value as BudgetId)} aria-label="Budget">
        {BUDGETS.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </select>
    ) : null;

  const detail = selected && (
    <ProjectDetail
      key={selected.id}
      project={selected}
      nearby={nearby}
      drives={drives}
      iso={iso}
      showIso={showIso}
      onToggleIso={() => setShowIso((v) => !v)}
      poiCats={poiCats}
      onTogglePoi={(c) =>
        setPoiCats((s) => {
          const n = new Set(s);
          if (n.has(c)) n.delete(c);
          else n.add(c);
          return n;
        })
      }
      onRetryNearby={() => setNearbyTry((n) => n + 1)}
      onBack={deselect}
      hideBack={isMobile}
    />
  );

  const list = <ProjectList projects={filtered} onSelect={select} onHover={setHoverId} hoverId={hoverId} />;

  const credit = (
    <footer className="credit">
      Concept demo by <a href="https://johnsaita.github.io">Geo Intelligence Lab</a> · listings from rickwestrealty.co.ke (Nov 2026) ·
      pins placed from listing text, confirm before use
    </footer>
  );

  const map = (
    <MapView
      projects={filtered}
      selected={selected}
      hoverId={hoverId}
      onSelect={select}
      onDeselect={deselect}
      onHover={setHoverId}
      bottomInset={isMobile ? sheetPx : 0}
      pois={nearby.state === "ready" ? (nearby.data ?? []).filter((p) => poiCats.has(p.category)) : []}
      drives={drives.state === "ready" ? drives.data ?? [] : []}
      iso={showIso && iso.state === "ready" ? iso.data ?? null : null}
    />
  );

  /* ---------- phone ---------- */

  if (isMobile) {
    const summary = selected ? (
      <div className="sheet-summary">
        <div>
          <strong>{selected.name}</strong>
          <span>{selected.priceLabel}</span>
        </div>
        <button
          className="sheet-close"
          aria-label="Close"
          onClick={(e) => {
            e.stopPropagation();
            deselect();
          }}
        >
          ×
        </button>
      </div>
    ) : (
      <div className="sheet-summary">
        <div>
          <strong>
            {filtered.length} {filtered.length === 1 ? "project" : "projects"}
            {area !== "All" ? ` in ${area}` : ""}
          </strong>
          <span>{snap === "peek" ? "Swipe up to browse" : "Swipe down to see the map"}</span>
        </div>
      </div>
    );

    return (
      <div className="m-app">
        <div className="m-map">{map}</div>

        <div className="m-top">{purposeToggle}</div>

        <BottomSheet
          snap={snap}
          onSnap={setSnap}
          onHeight={setSheetPx}
          peekPx={selected ? 72 : 124}
          header={summary}
          footer={selected ? null : <div className="m-areas">{areaChips}</div>}
        >
          {selected ? (
            detail
          ) : (
            <>
              <div className="m-list-tools">{budgetSelect}</div>
              {list}
              {credit}
            </>
          )}
        </BottomSheet>
      </div>
    );
  }

  /* ---------- desktop ---------- */

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="brand">
          <div className="brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" />
            </svg>
          </div>
          <div>
            <h1>Rickwest Projects Map</h1>
            <p>Every Rickwest development, what's nearby and how far it is.</p>
          </div>
        </header>

        {selected ? (
          detail
        ) : (
          <>
            <div className="filters">
              {purposeToggle}
              {areaChips}
              {budgetSelect}
            </div>
            {list}
          </>
        )}

        {credit}
      </aside>

      <main className="map-wrap">{map}</main>
    </div>
  );
}
