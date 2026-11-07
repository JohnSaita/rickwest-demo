import { useState } from "react";
import type { Project } from "../data/projects";

export function Photo({ project, className }: { project: Project; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!project.image || failed) {
    const initials = project.name
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0])
      .join("");
    return (
      <div className={`photo photo-fallback ${className ?? ""}`} aria-hidden>
        {initials}
      </div>
    );
  }
  return (
    <img
      className={`photo ${className ?? ""}`}
      src={project.image}
      alt={project.name}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

interface Props {
  projects: Project[];
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  hoverId: string | null;
}

export default function ProjectList({ projects, onSelect, onHover, hoverId }: Props) {
  return (
    <div className="list-wrap">
      <div className="count">
        {projects.length} {projects.length === 1 ? "project" : "projects"}
      </div>
      {projects.length === 0 ? (
        <p className="empty">No projects match. Try another area or budget.</p>
      ) : (
        <ul className="list">
          {projects.map((p) => (
            <li key={p.id}>
              <button
                className={`card ${hoverId === p.id ? "hover" : ""}`}
                onClick={() => onSelect(p.id)}
                onMouseEnter={() => onHover(p.id)}
                onMouseLeave={() => onHover(null)}
              >
                <Photo project={p} />
                <div className="card-body">
                  <div className="card-title">{p.name}</div>
                  <div className="card-sub">
                    {p.area} · {p.beds}
                  </div>
                  <div className="card-price">{p.priceLabel}</div>
                  {p.completion && <div className="card-tag">{p.completion}</div>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
