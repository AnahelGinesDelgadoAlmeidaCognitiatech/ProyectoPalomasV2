import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { db, type Pigeon } from "@/lib/db";

function Node({ pigeon, accent }: { pigeon?: Pigeon; accent?: string }) {
  const { t } = useTranslation();
  if (!pigeon) {
    return (
      <div className="flex h-full min-h-[72px] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/40 px-3 text-xs text-muted-foreground">
        {t("pedigree_tree.unknown")}
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
  const allPigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const genSetting = useLiveQuery(() => db.settings.get("pedigree.generations"), []);
  const maxGen = (genSetting?.value as number) || 3;

  const getPigeon = (id?: string) => allPigeons.find(p => p.id === id);

  const getAncestorsAtDepth = (id: string | undefined, targetDepth: number, currentDepth = 1): (Pigeon | undefined)[] => {
    const p = getPigeon(id);
    if (currentDepth === targetDepth) return [p];
    return [
      ...getAncestorsAtDepth(p?.fatherId, targetDepth, currentDepth + 1),
      ...getAncestorsAtDepth(p?.motherId, targetDepth, currentDepth + 1),
    ];
  };

  const cock = "border-l-4 border-l-primary";
  const hen = "border-l-4 border-l-accent";

  return (
    <div className="w-full relative group/tree">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent opacity-0 group-hover/tree:opacity-100 transition-opacity pointer-events-none z-10 md:hidden" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent opacity-100 md:hidden pointer-events-none z-10" />
      
      <div className="w-full overflow-x-auto pb-6">
        <div 
          className="grid gap-4 sm:gap-6 min-h-[400px]" 
          style={{ 
            gridTemplateColumns: `repeat(${maxGen}, minmax(200px, 1fr))`,
            width: "max-content",
            minWidth: "100%"
          }}
        >
        {Array.from({ length: maxGen }).map((_, colIndex) => {
          const depth = colIndex + 1;
          const ancestors = getAncestorsAtDepth(rootId, depth);
          
          return (
            <div key={depth} className="flex flex-col justify-around gap-3">
              {ancestors.map((p, i) => (
                <Node 
                  key={`${depth}-${i}`} 
                  pigeon={p} 
                  accent={depth === 1 ? "" : (i % 2 === 0 ? cock : hen)} 
                />
              ))}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
