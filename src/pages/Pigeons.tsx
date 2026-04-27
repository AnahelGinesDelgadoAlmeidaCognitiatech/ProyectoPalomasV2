import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pigeons, type Status } from "@/data/pigeons";
import { Search, Plus } from "lucide-react";

const statusStyles: Record<Status, string> = {
  breeder: "bg-primary/10 text-primary",
  racer: "bg-accent/10 text-accent",
  young: "bg-warning/10 text-warning",
  lost: "bg-destructive/10 text-destructive",
};

export default function Pigeons() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | Status>("all");

  const filtered = useMemo(() => {
    return pigeons.filter((p) => {
      const matchTab = tab === "all" || p.status === tab;
      const needle = q.toLowerCase();
      const matchQ =
        !needle ||
        p.name.toLowerCase().includes(needle) ||
        p.ringNumber.toLowerCase().includes(needle) ||
        p.loft.toLowerCase().includes(needle);
      return matchTab && matchQ;
    });
  }, [q, tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pigeons</h1>
          <p className="text-muted-foreground">Manage your loft — {pigeons.length} birds total.</p>
        </div>
        <Button className="gap-2 shadow-elegant">
          <Plus className="h-4 w-4" /> Add pigeon
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="breeder">Breeders</TabsTrigger>
            <TabsTrigger value="racer">Racers</TabsTrigger>
            <TabsTrigger value="young">Young</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ring number, name..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((p) => (
          <Link key={p.id} to={`/pigeons/${p.id}`}>
            <Card className="group overflow-hidden border-border/60 shadow-soft transition-smooth hover:-translate-y-0.5 hover:shadow-card">
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.ringNumber}</p>
                  </div>
                  <Badge variant="secondary" className={`border-0 capitalize ${statusStyles[p.status]}`}>
                    {p.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.sex === "cock" ? "♂ Cock" : "♀ Hen"} · {p.color}</span>
                  <span>{p.bornYear}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
            No pigeons match your search.
          </div>
        )}
      </div>
    </div>
  );
}
