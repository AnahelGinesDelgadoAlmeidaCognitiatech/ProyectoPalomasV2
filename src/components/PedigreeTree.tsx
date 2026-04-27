import { Link } from "react-router-dom";
import { getPigeon, type Pigeon } from "@/data/pigeons";

function Node({ pigeon, accent }: { pigeon?: Pigeon; accent?: string }) {
  if (!pigeon) {
    return (
      <div className="flex h-full min-h-[72px] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 px-3 text-xs text-muted-foreground">
        Unknown
      </div>
    );
  }
  return (
    <Link
      to={`/pigeons/${pigeon.id}`}
      className={`group flex h-full min-h-[72px] flex-col justify-center gap-0.5 rounded-lg border border-border bg-card px-3 py-2 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-card ${accent ?? ""}`}
    >
      <p className="text-sm font-semibold leading-tight truncate">{pigeon.name}</p>
      <p className="text-[11px] text-muted-foreground truncate">{pigeon.ringNumber}</p>
      <p className="text-[11px] text-muted-foreground">{pigeon.color} · {pigeon.bornYear}</p>
    </Link>
  );
}

export function PedigreeTree({ rootId }: { rootId: string }) {
  const self = getPigeon(rootId);
  const father = getPigeon(self?.fatherId);
  const mother = getPigeon(self?.motherId);
  const ff = getPigeon(father?.fatherId);
  const fm = getPigeon(father?.motherId);
  const mf = getPigeon(mother?.fatherId);
  const mm = getPigeon(mother?.motherId);

  const cock = "border-l-4 border-l-primary";
  const hen = "border-l-4 border-l-accent";

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {/* Self */}
      <div className="flex flex-col justify-center">
        {self && <Node pigeon={self} />}
      </div>
      {/* Parents */}
      <div className="grid grid-rows-2 gap-3">
        <Node pigeon={father} accent={cock} />
        <Node pigeon={mother} accent={hen} />
      </div>
      {/* Grandparents */}
      <div className="grid grid-rows-4 gap-3">
        <Node pigeon={ff} accent={cock} />
        <Node pigeon={fm} accent={hen} />
        <Node pigeon={mf} accent={cock} />
        <Node pigeon={mm} accent={hen} />
      </div>
    </div>
  );
}
