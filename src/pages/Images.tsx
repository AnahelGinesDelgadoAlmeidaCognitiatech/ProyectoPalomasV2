import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";

export default function Images() {
  const pigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const withImg = pigeons.filter((p) => p.image);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><ImageIcon className="h-5 w-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Images</h1>
          <p className="text-muted-foreground">Todas las fotos de tu palomar — {withImg.length} imágenes.</p>
        </div>
      </div>
      {withImg.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">Aún no hay imágenes en tus palomas.</CardContent></Card>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {withImg.map((p) => (
            <Link key={p.id} to={`/pigeons/${p.id}`} className="group relative overflow-hidden rounded-lg shadow-soft">
              <img src={p.image} alt={p.name} loading="lazy" className="aspect-square w-full object-cover transition-smooth group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-xs font-medium text-white truncate">{p.name}</p>
                <p className="text-[10px] text-white/70 truncate">{p.ringNumber}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
