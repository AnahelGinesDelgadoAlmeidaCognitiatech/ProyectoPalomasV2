import { useLiveQuery } from "dexie-react-hooks";
import { BarChart3, PieChart as PieChartIcon, TrendingUp, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { db } from "@/lib/db";

export default function Statistics() {
  const { t } = useTranslation();
  const pigeons = useLiveQuery(() => db.pigeons.toArray(), []) ?? [];
  const races = useLiveQuery(() => db.races.toArray(), []) ?? [];

  // Data processing for Status
  const statusData = ["breeder", "racer", "young", "lost"].map((s) => ({
    name: t(`status.${s}`),
    value: pigeons.filter((p) => p.status === s).length,
    key: s
  })).filter(d => d.value > 0);

  const COLORS: Record<string, string> = {
    breeder: "#7c3aed", // primary
    racer: "#0ea5e9",   // accent
    young: "#f59e0b",   // warning
    lost: "#ef4444",    // destructive
  };

  // Data processing for Year
  const yearCounts: Record<string, number> = {};
  pigeons.forEach((p) => { 
    if (p.bornYear) yearCounts[p.bornYear] = (yearCounts[p.bornYear] || 0) + 1; 
  });
  const yearData = Object.entries(yearCounts)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, count]) => ({
      year,
      count
    }));

  const totalWins = pigeons.reduce((a, b) => a + (b.wins ?? 0), 0);
  const totalRaces = pigeons.reduce((a, b) => a + (b.races ?? 0), 0);
  const winRate = totalRaces ? ((totalWins / totalRaces) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("statistics.title")}</h1>
          <p className="text-muted-foreground">{t("statistics.desc")}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-none shadow-soft bg-gradient-to-br from-background to-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t("statistics.total_pigeons")}
              </p>
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{pigeons.length}</div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-soft bg-gradient-to-br from-background to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t("statistics.win_rate")}
              </p>
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">{winRate}%</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-soft bg-gradient-to-br from-background to-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                {t("statistics.total_races")}
              </p>
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{races.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Status - Pie Chart */}
        <Card className="overflow-hidden border-none shadow-elegant">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <PieChartIcon className="h-4 w-4" />
              <CardTitle className="text-lg">{t("statistics.by_status")}</CardTitle>
            </div>
            <CardDescription>{t("statistics.status_distribution_desc", "Distribución actual de las palomas por su estado")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.key] || COLORS.breeder} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "12px", 
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" 
                      }}
                      itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: "bold" }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  {t("statistics.no_data")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* By Year - Bar Chart */}
        <Card className="overflow-hidden border-none shadow-elegant">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <BarChart3 className="h-4 w-4" />
              <CardTitle className="text-lg">{t("statistics.by_year")}</CardTitle>
            </div>
            <CardDescription>{t("statistics.year_distribution_desc", "Cantidad de palomas nacidas por cada año")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {yearData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                    />
                    <Tooltip 
                      cursor={{ fill: "rgba(124, 58, 237, 0.05)" }}
                      contentStyle={{ 
                        borderRadius: "12px", 
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--popover))",
                        color: "hsl(var(--popover-foreground))",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" 
                      }}
                      itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                      labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: "bold" }}
                    />
                    <Bar 
                      name={t("statistics.pigeons")}
                      dataKey="count" 
                      fill="#7c3aed" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  {t("statistics.no_data")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
