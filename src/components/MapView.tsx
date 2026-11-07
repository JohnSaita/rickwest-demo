import { useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from "react-map-gl/mapbox";
import type { FeatureCollection, Polygon } from "geojson";
import "mapbox-gl/dist/mapbox-gl.css";
import { DESTINATIONS, PROJECTS, type Project } from "../data/projects";
import { circle, poisToGeoJSON, TOKEN, type DriveTime, type Poi } from "../lib/api";

interface Props {
  projects: Project[];
  selected: Project | null;
  hoverId: string | null;
  onSelect: (id: string) => void;
  onDeselect: () => void;
  /** Height of the phone bottom sheet, so pins stay in the visible part of the map. */
  bottomInset: number;
  onHover: (id: string | null) => void;
  pois: Poi[];
  drives: DriveTime[];
  iso: FeatureCollection<Polygon> | null;
}

const STYLES = [
  { id: "streets", label: "Map", url: "mapbox://styles/mapbox/light-v11" },
  { id: "satellite", label: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
];

function allBounds(list: Project[]): [[number, number], [number, number]] {
  const xs = list.map((p) => p.coords[0]);
  const ys = list.map((p) => p.coords[1]);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}

function padding(bottomInset: number) {
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  return mobile
    ? { top: 80, bottom: bottomInset + 30, left: 30, right: 30 }
    : { top: 70, bottom: 70, left: 70, right: 70 };
}

export default function MapView({ projects, selected, hoverId, onSelect, onDeselect, bottomInset, onHover, pois, drives, iso }: Props) {
  const ref = useRef<MapRef>(null);
  const [style, setStyle] = useState(STYLES[0]);
  const [poiPopup, setPoiPopup] = useState<{ name: string; lng: number; lat: number } | null>(null);

  // Frame all projects when nothing is selected; zoom to the project when one is.
  useEffect(() => {
    const map = ref.current;
    if (!map) return;
    if (selected) {
      map.flyTo({ center: selected.coords, zoom: 14, duration: 1200, essential: true, padding: padding(bottomInset) });
    } else {
      const list = projects.length ? projects : PROJECTS;
      if (list.length === 1) map.flyTo({ center: list[0].coords, zoom: 14, padding: padding(bottomInset) });
      else map.fitBounds(allBounds(list), { padding: padding(bottomInset), duration: 900, maxZoom: 14 });
    }
    setPoiPopup(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, projects]);

  // When the phone sheet moves, keep the selected project in the visible part of the map.
  useEffect(() => {
    const map = ref.current;
    if (!map || !selected) return;
    map.easeTo({ center: selected.coords, padding: padding(bottomInset), duration: 350 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bottomInset]);

  // Zoom out to show the drive-time areas when they arrive.
  useEffect(() => {
    if (!iso || !ref.current) return;
    const pts = iso.features.flatMap((f) => f.geometry.coordinates[0]) as [number, number][];
    if (!pts.length) return;
    const xs = pts.map((c) => c[0]);
    const ys = pts.map((c) => c[1]);
    ref.current.fitBounds(
      [
        [Math.min(...xs), Math.min(...ys)],
        [Math.max(...xs), Math.max(...ys)],
      ],
      { padding: padding(bottomInset), duration: 900 },
    );
  }, [iso]);

  const rings = useMemo(() => {
    if (!selected) return null;
    const features = [circle(selected.coords, 1), circle(selected.coords, 2)];
    return { type: "FeatureCollection", features } as FeatureCollection<Polygon>;
  }, [selected]);

  const approx = useMemo(
    () => (selected && selected.precision === "area" ? circle(selected.coords, 0.35) : null),
    [selected],
  );

  const poiData = useMemo(() => poisToGeoJSON(pois), [pois]);
  const routeData = useMemo(
    () => ({ type: "FeatureCollection" as const, features: drives.map((d) => d.route) }),
    [drives],
  );

  // Draw biggest contour first so the 10-minute area sits on top.
  const isoSorted = useMemo(() => {
    if (!iso) return null;
    const features = [...iso.features].sort((a, b) => (b.properties?.contour ?? 0) - (a.properties?.contour ?? 0));
    return { ...iso, features };
  }, [iso]);

  return (
    <div className="map">
      <Map
        ref={ref}
        mapboxAccessToken={TOKEN}
        initialViewState={{ bounds: allBounds(PROJECTS), fitBoundsOptions: { padding: 60 } }}
        mapStyle={style.url}
        interactiveLayerIds={["poi-dots"]}
        onClick={(e) => {
          const f = e.features?.[0];
          if (f && f.geometry.type === "Point") {
            const [lng, lat] = f.geometry.coordinates as [number, number];
            setPoiPopup({ name: String(f.properties?.name ?? ""), lng, lat });
          } else if (poiPopup) setPoiPopup(null);
          else if (selected) onDeselect(); // tap on empty map closes the project
        }}
        cursor="auto"
      >
        <NavigationControl position="top-right" showCompass={false} />

        {isoSorted && (
          <Source id="iso" type="geojson" data={isoSorted}>
            <Layer
              id="iso-fill"
              type="fill"
              paint={{
                "fill-color": ["match", ["get", "contour"], 10, "#075A78", 20, "#087FA8", "#35B9C9"],
                "fill-opacity": 0.16,
              }}
            />
            <Layer
              id="iso-line"
              type="line"
              paint={{
                "line-color": ["match", ["get", "contour"], 10, "#075A78", 20, "#087FA8", "#35B9C9"],
                "line-width": 1.5,
              }}
            />
          </Source>
        )}

        {rings && (
          <Source id="rings" type="geojson" data={rings}>
            <Layer id="rings-line" type="line" paint={{ "line-color": "#0D2A4F", "line-width": 1, "line-opacity": 0.35, "line-dasharray": [2, 3] }} />
            <Layer
              id="rings-label"
              type="symbol"
              layout={{
                "symbol-placement": "line",
                "text-field": ["concat", ["to-string", ["get", "radiusKm"]], " km"],
                "text-size": 11,
              }}
              paint={{ "text-color": "#0D2A4F", "text-halo-color": "#fff", "text-halo-width": 1.5 }}
            />
          </Source>
        )}

        {approx && (
          <Source id="approx" type="geojson" data={approx}>
            <Layer id="approx-fill" type="fill" paint={{ "fill-color": "#F4A62A", "fill-opacity": 0.12 }} />
            <Layer id="approx-line" type="line" paint={{ "line-color": "#C9741B", "line-width": 1.5, "line-dasharray": [1, 2] }} />
          </Source>
        )}

        {drives.length > 0 && (
          <Source id="routes" type="geojson" data={routeData}>
            <Layer id="routes-casing" type="line" layout={{ "line-cap": "round", "line-join": "round" }} paint={{ "line-color": "#fff", "line-width": 6, "line-opacity": 0.9 }} />
            <Layer id="routes-line" type="line" layout={{ "line-cap": "round", "line-join": "round" }} paint={{ "line-color": "#087FA8", "line-width": 3 }} />
          </Source>
        )}

        {pois.length > 0 && (
          <Source id="pois" type="geojson" data={poiData}>
            <Layer
              id="poi-dots"
              type="circle"
              paint={{
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3, 15, 6],
                "circle-color": ["get", "color"],
                "circle-stroke-color": "#fff",
                "circle-stroke-width": 1.5,
              }}
            />
            <Layer
              id="poi-labels"
              type="symbol"
              minzoom={14.5}
              layout={{ "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.1], "text-anchor": "top", "text-max-width": 9 }}
              paint={{ "text-color": "#4A5D73", "text-halo-color": "#fff", "text-halo-width": 1.2 }}
            />
          </Source>
        )}

        {selected &&
          drives.map((d) => {
            const dest = DESTINATIONS.find((x) => x.id === d.id)!;
            return (
              <Marker key={d.id} longitude={dest.coords[0]} latitude={dest.coords[1]} anchor="bottom">
                <div className="dest-pin">
                  {d.label.split(" (")[0]} · {d.minutes} min
                </div>
              </Marker>
            );
          })}

        {(selected && !projects.some((x) => x.id === selected.id) ? [...projects, selected] : projects).map((p) => {
          const isSel = selected?.id === p.id;
          const active = isSel || hoverId === p.id;
          return (
            <Marker
              key={p.id}
              longitude={p.coords[0]}
              latitude={p.coords[1]}
              anchor="bottom"
              style={{ zIndex: isSel ? 20 : active ? 10 : 1 }}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                onSelect(p.id);
              }}
            >
              <button
                className={`pin ${active ? "active" : ""} ${selected && !isSel ? "dim" : ""} ${p.purpose}`}
                onMouseEnter={() => onHover(p.id)}
                onMouseLeave={() => onHover(null)}
                aria-label={`${p.name}, ${p.priceLabel}`}
                title={p.name}
              >
                {isSel ? p.name : p.pinLabel}
              </button>
            </Marker>
          );
        })}

        {poiPopup && (
          <Popup longitude={poiPopup.lng} latitude={poiPopup.lat} closeButton={false} onClose={() => setPoiPopup(null)} offset={10}>
            {poiPopup.name}
          </Popup>
        )}
      </Map>

      <div className="style-switch" role="group" aria-label="Basemap">
        {STYLES.map((s) => (
          <button key={s.id} className={style.id === s.id ? "on" : ""} onClick={() => setStyle(s)}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
