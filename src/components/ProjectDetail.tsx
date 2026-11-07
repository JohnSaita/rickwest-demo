import type { FeatureCollection, Polygon } from "geojson";
import { SALES_WHATSAPP, type Project } from "../data/projects";
import { ISO_MINUTES, POI_META, type DriveTime, type Poi, type PoiCategory } from "../lib/api";
import { Photo } from "./ProjectList";

type Load<T> = { state: "idle" | "loading" | "error" | "ready"; data?: T };

interface Props {
  project: Project;
  nearby: Load<Poi[]>;
  drives: Load<DriveTime[]>;
  iso: Load<FeatureCollection<Polygon>>;
  showIso: boolean;
  onToggleIso: () => void;
  poiCats: Set<PoiCategory>;
  onTogglePoi: (c: PoiCategory) => void;
  onRetryNearby: () => void;
  onBack: () => void;
  hideBack?: boolean;
}

const km = (n: number) => (n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1)} km`);

export default function ProjectDetail(props: Props) {
  const { project: p, nearby, drives, iso, showIso } = props;
  const wa = `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(
    `Hi Rickwest, I saw ${p.name} (${p.area}) on your projects map. Please send me more details.`,
  )}`;

  const cats = Object.keys(POI_META) as PoiCategory[];
  const pois = nearby.data ?? [];

  return (
    <div className="detail">
      {!props.hideBack && (
        <button className="back" onClick={props.onBack}>
          ← All projects
        </button>
      )}

      <Photo project={p} className="hero" />

      <div className="detail-head">
        <h2>{p.name}</h2>
        <div className="loc">
          {p.locationNote}
          <span className={`badge ${p.precision}`}>{p.precision === "landmark" ? "Pinned by landmark" : "Approximate location"}</span>
        </div>
        <div className="price">{p.priceLabel}</div>
        <div className="facts">
          <span>{p.beds}</span>
          <span>{p.size}</span>
          {p.completion && <span>Completion: {p.completion}</span>}
        </div>
      </div>

      <div className="actions">
        <a className="btn wa" href={wa} target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path
              fill="currentColor"
              d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.2Z"
            />
          </svg>
          Chat on WhatsApp
        </a>
        <a className="btn ghost" href={p.listingUrl} target="_blank" rel="noreferrer">
          View listing
        </a>
      </div>

      <section>
        <h3>Drive times now</h3>
        {drives.state === "loading" && <p className="muted">Checking live traffic…</p>}
        {drives.state === "error" && <p className="muted">Drive times are unavailable right now.</p>}
        {drives.state === "ready" && (
          <ul className="drives">
            {drives.data!.map((d) => (
              <li key={d.id}>
                <span>{d.label}</span>
                <strong>{d.minutes} min</strong>
                <em>{km(d.km)}</em>
              </li>
            ))}
          </ul>
        )}
        <label className="toggle">
          <input type="checkbox" checked={showIso} onChange={props.onToggleIso} />
          <span>
            Show areas within {ISO_MINUTES.join(" / ")} min drive
            {iso.state === "loading" && " (loading…)"}
            {iso.state === "error" && " (unavailable)"}
          </span>
        </label>
      </section>

      <section>
        <h3>Within 2 km</h3>
        {nearby.state === "loading" && <p className="muted">Finding schools, hospitals and shops…</p>}
        {nearby.state === "error" && (
          <p className="muted">
            Nearby places didn't load. <button className="link" onClick={props.onRetryNearby}>Try again</button>
          </p>
        )}
        {nearby.state === "ready" && (
          <ul className="nearby">
            {cats.map((c) => {
              const list = pois.filter((x) => x.category === c);
              const nearest = list[0];
              return (
                <li key={c}>
                  <label>
                    <input type="checkbox" checked={props.poiCats.has(c)} onChange={() => props.onTogglePoi(c)} />
                    <i style={{ background: POI_META[c].color }} />
                    <span className="n-label">
                      {POI_META[c].label} <b>{list.length}</b>
                    </span>
                  </label>
                  {nearest && (
                    <div className="nearest">
                      Nearest: {nearest.name} · {km(nearest.km)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {p.units && (
        <section>
          <h3>Units</h3>
          <table className="units">
            <tbody>
              {p.units.map((u) => (
                <tr key={u.type + u.size}>
                  <td>{u.type}</td>
                  <td>{u.size}</td>
                  <td>{u.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {p.highlights.length > 0 && (
        <section>
          <h3>Highlights</h3>
          <ul className="highlights">
            {p.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="fine">
        Drive times: Mapbox, live traffic at time of viewing. Nearby places: © OpenStreetMap contributors. Prices from
        the Rickwest listing; confirm with sales.
      </p>
    </div>
  );
}
