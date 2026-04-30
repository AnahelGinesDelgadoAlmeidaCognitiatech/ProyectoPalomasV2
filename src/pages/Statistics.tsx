import { useLiveQuery } from "dexie-react-hooks";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export default function Statistics() {
  const pigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const races = useLiveQuery(() => db.races.toArray(), []) ?? [];

  const byStatus = ["breeder", "racer", "young", "lost"].map((s) => ({
    s, n: pigeons.filter((p) => p.status === s).length,
  }));
  const byYear: Record<string, number> = {};
  pigeons.forEach((p) => { if (p.bornYear) byYear[p.bornYear] = (byYear[p.bornYear] || 0) + 1; });
  const totalWins = pigeons.reduce((a, b) => a + (b.wins ?? 0), 0);
  const totalRaces = pigeons.reduce((a, b) => a + (b.races ?? 0), 0);
  const winRate = totalRaces ? ((totalWins / totalRaces) * 100).toFixed(1) : "0";

  const max = Math.max(1, ...byStatus.map((b) => b.n));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><BarChart3 className="h-5 w-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">Analítica de tu palomar.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">Total palomas</p><p className="text-3xl font-bold">{pigeons.length}</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">% victoria</p><p className="text-3xl font-bold text-primary">{winRate}%</p></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-xs uppercase text-muted-foreground">Carreras registradas</p><p className="text-3xl font-bold">{races.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Por estado</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {byStatus.map((b) => (
            <div key={b.s} className="space-y-1">
              <div className="flex justify-between text-xs"><span className="capitalize">{b.s}</span><span>{b.n}</span></div>
              <div className="h-2 w-full rounded-full bg-secondary"><div className="h-2 rounded-full bg-primary" style={{ width: `${(b.n / max) * 100}%` }} /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Por año de nacimiento</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(byYear).sort(([a], [b]) => Number(b) - Number(a)).map(([y, n]) => (
            <div key={y} className="flex justify-between text-sm"><span>{y}</span><span className="font-medium">{n}</span></div>
          ))}
          {Object.keys(byYear).length === 0 && <p className="text-sm text-muted-foreground">Sin datos.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
