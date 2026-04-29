import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, CloudOff } from "lucide-react";
import { db, seedIfEmpty, type Status } from "@/lib/db";

const statusStyles: Record<Status, string> = {
  breeder: "bg-primary/10 text-primary",
  racer: "bg-accent/10 text-accent",
  young: "bg-warning/10 text-warning",
  lost: "bg-destructive/10 text-destructive",
};

export default function Pigeons() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | Status>("all");

  useEffect(() => {
    seedIfEmpty();
  }, []);

  const all = useLiveQuery(() => db.pigeons.orderBy("updatedAt").reverse().toArray(), []) ?? [];
  const pendingSync = useLiveQuery(
    () => db.syncQueue.filter((i) => !i.syncedAt).count(),
    []
  ) ?? 0;

  const filtered = useMemo(() => {
    return all.filter((p) => {
      const matchTab = tab === "all" || p.status === tab;
      const needle = q.toLowerCase();
      const matchQ =
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        p.ringNumber.toLowerCase().includes(needle) ||
        p.loft.toLowerCase().includes(needle);
      return matchTab && matchQ;
    });
  }, [all, q, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pigeons</h1>
          <p className="text-muted-foreground">
            Manage your loft — {all.length} birds total.
            {pendingSync > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-warning">
                <CloudOff className="h-3 w-3" /> {pendingSync} pending sync
              </span>
            )}
          </p>
        </div>
        <Button asChild className="gap-2 shadow-elegant">
          <Link to="/pigeons/new"><Plus className="h-4 w-4" /> Add pigeon</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="breeder">Breeders</TabsTrigger>
            <TabsTrigger value="racer">Racers</TabsTrigger>
            <TabsTrigger value="young">Young</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-xs w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, band, loft..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No pigeons match your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/pigeons/${p.id}`} className="group">
              <Card className="overflow-hidden shadow-soft transition-smooth hover:shadow-card">
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-sm">
                      No image
                    </div>
                  )}
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] uppercase text-muted-foreground truncate">
                        {p.ringNumber}
                      </p>
                      <h3 className="font-semibold truncate">{p.name || "—"}</h3>
                    </div>
                    <Badge variant="secondary" className={`border-0 capitalize ${statusStyles[p.status]}`}>
                      {p.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.color || "—"}</span>
                    <span>{p.bornYear ?? "—"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
