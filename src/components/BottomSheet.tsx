import { useEffect, useRef, useState, type ReactNode } from "react";

export type Snap = "peek" | "half" | "full";

interface Props {
  snap: Snap;
  onSnap: (s: Snap) => void;
  /** Reports the settled sheet height so the map can keep pins above it. */
  onHeight: (px: number) => void;
  peekPx: number;
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

const TOP_GAP = 76; // keeps the Buy / Rent bar visible when the sheet is fully open

function useViewportHeight() {
  const [h, setH] = useState(() => window.innerHeight);
  useEffect(() => {
    const on = () => setH(window.innerHeight);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return h;
}

export default function BottomSheet({ snap, onSnap, onHeight, peekPx, header, footer, children }: Props) {
  const vh = useViewportHeight();
  const heights: Record<Snap, number> = {
    peek: peekPx,
    half: Math.round(vh * 0.5),
    full: vh - TOP_GAP,
  };
  const target = heights[snap];

  const [dragH, setDragH] = useState<number | null>(null);
  const drag = useRef<{ y: number; h: number; t: number; moved: boolean } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onHeight(target);
  }, [target, onHeight]);

  // New content (another project, or back to the list) starts at the top.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [children]);

  const start = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return; // let buttons in the header work
    drag.current = { y: e.clientY, h: target, t: performance.now(), moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = d.y - e.clientY;
    if (Math.abs(dy) > 4) d.moved = true;
    setDragH(Math.max(peekPx, Math.min(heights.full, d.h + dy)));
  };

  const end = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      // A tap on the handle: open from peek, otherwise step down one level.
      setDragH(null);
      onSnap(snap === "peek" ? "half" : snap === "full" ? "half" : "full");
      return;
    }
    const h = dragH ?? target;
    const velocity = (d.y - e.clientY) / Math.max(1, performance.now() - d.t); // px per ms, up is positive
    let next: Snap;
    if (velocity > 0.6) next = h < heights.half ? "half" : "full";
    else if (velocity < -0.6) next = h > heights.half ? "half" : "peek";
    else {
      const order: Snap[] = ["peek", "half", "full"];
      next = order.reduce((best, s) => (Math.abs(heights[s] - h) < Math.abs(heights[best] - h) ? s : best), "peek" as Snap);
    }
    setDragH(null);
    onSnap(next);
  };

  const height = dragH ?? target;

  return (
    <section className={`sheet ${dragH != null ? "dragging" : ""} snap-${snap}`} style={{ height }}>
      <div className="sheet-grab" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <div className="sheet-handle" aria-hidden />
        {header}
      </div>
      <div className="sheet-body" ref={bodyRef}>
        {children}
      </div>
      {footer && <div className="sheet-footer">{footer}</div>}
    </section>
  );
}
