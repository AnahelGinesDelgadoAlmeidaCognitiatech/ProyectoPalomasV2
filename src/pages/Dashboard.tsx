import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bird, Trophy, Home, TrendingUp, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";

export default function Dashboard() {
  const pigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const lofts = new Set(pigeons.map((p) => p.loft).filter(Boolean));
  const racers = pigeons.filter((p) => p.status === "racer");
  const totalWins = pigeons.reduce((s, p) => s + (p.wins ?? 0), 0);

  const stats = [
    { label: "Total pigeons", value: pigeons.length, change: "Tus aves registradas", icon: Bird, tint: "bg-primary/10 text-primary" },
    { label: "Active racers", value: racers.length, change: "En competición", icon: Trophy, tint: "bg-accent/10 text-accent" },
    { label: "Lofts", value: lofts.size, change: "Palomares", icon: Home, tint: "bg-warning/10 text-warning" },
    { label: "Total wins", value: totalWins, change: "Histórico", icon: TrendingUp, tint: "bg-primary-glow/10 text-primary-glow" },
  ];

  const top = [...pigeons].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0)).slice(0, 5);
  const recent = [...pigeons].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your loft and racing performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 shadow-soft transition-smooth hover:shadow-card">
            <CardContent className="flex items-start justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-2 text-3xl font-bold">{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.change}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tint}`}>
                <s.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top performers</CardTitle>
            <Link to="/pigeons" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {top.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay palomas. Añade la primera.</p>}
            {top.map((p, i) => (
              <Link
                key={p.id}
                to={`/pigeons/${p.id}`}
                className="flex items-center gap-4 rounded-lg p-3 transition-smooth hover:bg-secondary"
              >
                <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-secondary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.ringNumber}</p>
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-0">
                  {p.wins ?? 0} wins
                </Badge>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Recently added</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">Sin actividad reciente.</p>}
            {recent.map((p) => (
              <Link key={p.id} to={`/pigeons/${p.id}`} className="flex items-center gap-3 rounded-lg p-2 transition-smooth hover:bg-secondary">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-secondary" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.loft}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
