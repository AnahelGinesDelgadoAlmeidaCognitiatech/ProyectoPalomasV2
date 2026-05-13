import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bird, Trophy, Home, TrendingUp, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/lib/db";

export default function Dashboard() {
  const { t } = useTranslation();
  const pigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const lofts = new Set(pigeons.map((p) => p.loft).filter(Boolean));
  const racers = pigeons.filter((p) => p.status === "racer");
  const totalWins = pigeons.reduce((s, p) => s + (p.wins ?? 0), 0);

  const stats = [
    { label: t("dashboard.stats_total"), value: pigeons.length, change: t("dashboard.stats_total_desc"), icon: Bird, tint: "bg-primary/10 text-primary" },
    { label: t("dashboard.stats_racers"), value: racers.length, change: t("dashboard.stats_racers_desc"), icon: Trophy, tint: "bg-accent/10 text-accent" },
    { label: t("dashboard.stats_lofts"), value: lofts.size, change: t("dashboard.stats_lofts_desc"), icon: Home, tint: "bg-warning/10 text-warning" },
    { label: t("dashboard.stats_wins"), value: totalWins, change: t("dashboard.stats_wins_desc"), icon: TrendingUp, tint: "bg-primary-glow/10 text-primary-glow" },
  ];

  const top = [...pigeons].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0)).slice(0, 5);
  const recent = [...pigeons].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">{t("dashboard.desc")}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60 shadow-soft transition-smooth hover:shadow-card">
            <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{s.label}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold">{s.value}</p>
                <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground line-clamp-2">{s.change}</p>
              </div>
              <div className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
                <s.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("dashboard.top_performers")}</CardTitle>
            <Link to="/pigeons" className="text-sm text-primary hover:underline">{t("dashboard.view_all")}</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {top.length === 0 && <p className="text-sm text-muted-foreground">{t("dashboard.no_pigeons")}</p>}
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
                  {p.wins ?? 0} {t("dashboard.wins")}
                </Badge>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">{t("dashboard.recent")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">{t("dashboard.no_recent")}</p>}
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
