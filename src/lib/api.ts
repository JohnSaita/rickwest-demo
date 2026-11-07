import type { Feature, FeatureCollection, LineString, Point, Polygon } from "geojson";
import { DESTINATIONS } from "../data/projects";

export const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

type LngLat = [number, number];

/* ---------- helpers ---------- */

export function distanceKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** A circle polygon around a point, for "approximate location" and the 1 / 2 km rings. */
export function circle(center: LngLat, radiusKm: number, steps = 72): Feature<Polygon> {
  const [lng, lat] = center;
  const coords: LngLat[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const dx = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.cos(t);
    const dy = (radiusKm / 110.574) * Math.sin(t);
    coords.push([lng + dx, lat + dy]);
  }
  return { type: "Feature", properties: { radiusKm }, geometry: { type: "Polygon", coordinates: [coords] } };
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    if (Date.now() - t > 1000 * 60 * 60 * 24 * 7) return null; // one week
    return v as T;
  } catch {
    return null;
  }
}
function cacheSet(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), v }));
  } catch {
    /* storage full or blocked: ignore */
  }
}

/* ---------- nearby places (OpenStreetMap via Overpass) ---------- */

export type PoiCategory = "school" | "health" | "shopping";

export const POI_META: Record<PoiCategory, { label: string; color: string }> = {
  school: { label: "Schools", color: "#7B6CD9" },
  health: { label: "Hospitals & clinics", color: "#E5636B" },
  shopping: { label: "Malls & supermarkets", color: "#36A68A" },
};

export interface Poi {
  name: string;
  category: PoiCategory;
  coords: LngLat;
  km: number;
}

const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

function categorise(tags: Record<string, string>): PoiCategory | null {
  const a = tags.amenity;
  const s = tags.shop;
  if (a && ["school", "kindergarten", "college", "university"].includes(a)) return "school";
  if (a && ["hospital", "clinic"].includes(a)) return "health";
  if (tags.healthcare === "hospital" || tags.healthcare === "clinic") return "health";
  if (s && ["mall", "supermarket"].includes(s)) return "shopping";
  return null;
}

export async function fetchNearby(id: string, center: LngLat, radiusM = 2000): Promise<Poi[]> {
  const key = `rw-nearby-${id}-${radiusM}`;
  const hit = cacheGet<Poi[]>(key);
  if (hit) return hit;

  const [lng, lat] = center;
  const around = `(around:${radiusM},${lat},${lng})`;
  const q = `[out:json][timeout:25];(
    nwr["amenity"~"^(school|kindergarten|college|university|hospital|clinic)$"]${around};
    nwr["shop"~"^(mall|supermarket)$"]${around};
  );out center tags 300;`;

  let lastErr: unknown;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(q) });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = await res.json();
      const seen = new Set<string>();
      const pois: Poi[] = [];
      for (const el of json.elements ?? []) {
        const tags = el.tags ?? {};
        const cat = categorise(tags);
        const name: string | undefined = tags.name;
        if (!cat || !name) continue;
        const c: LngLat = el.type === "node" ? [el.lon, el.lat] : [el.center?.lon, el.center?.lat];
        if (c[0] == null) continue;
        const dedupe = `${cat}:${name.toLowerCase()}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        pois.push({ name, category: cat, coords: c, km: distanceKm(center, c) });
      }
      pois.sort((a, b) => a.km - b.km);
      cacheSet(key, pois);
      return pois;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

/* ---------- drive times (Mapbox Directions, live traffic) ---------- */

export interface DriveTime {
  id: string;
  label: string;
  minutes: number;
  km: number;
  route: Feature<LineString>;
}

export async function fetchDriveTimes(center: LngLat): Promise<DriveTime[]> {
  if (!TOKEN) throw new Error("No Mapbox token");
  const results = await Promise.allSettled(
    DESTINATIONS.map(async (d) => {
      const coords = `${center[0]},${center[1]};${d.coords[0]},${d.coords[1]}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}?geometries=geojson&overview=full&access_token=${TOKEN}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Directions ${res.status}`);
      const json = await res.json();
      const r = json.routes?.[0];
      if (!r) throw new Error("No route");
      return {
        id: d.id,
        label: d.label,
        minutes: Math.round(r.duration / 60),
        km: r.distance / 1000,
        route: { type: "Feature", properties: { id: d.id }, geometry: r.geometry },
      } as DriveTime;
    }),
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
}

/* ---------- drive-time areas (Mapbox Isochrone) ---------- */

export const ISO_MINUTES = [10, 20, 30];

export async function fetchIsochrone(center: LngLat): Promise<FeatureCollection<Polygon>> {
  if (!TOKEN) throw new Error("No Mapbox token");
  const url = `https://api.mapbox.com/isochrone/v1/mapbox/driving/${center[0]},${center[1]}?contours_minutes=${ISO_MINUTES.join(
    ",",
  )}&polygons=true&denoise=1&access_token=${TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Isochrone ${res.status}`);
  return res.json();
}

export function poisToGeoJSON(pois: Poi[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: pois.map((p) => ({
      type: "Feature",
      properties: { name: p.name, category: p.category, color: POI_META[p.category].color },
      geometry: { type: "Point", coordinates: p.coords },
    })),
  };
}
