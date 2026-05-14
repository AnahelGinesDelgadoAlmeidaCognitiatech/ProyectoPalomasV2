import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, CloudOff, Filter, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { db, seedIfEmpty, type Status, type SavedFilter } from "@/lib/db";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusStyles: Record<Status, string> = {
  breeder: "bg-primary/10 text-primary",
  racer: "bg-accent/10 text-accent",
  young: "bg-warning/10 text-warning",
  lost: "bg-destructive/10 text-destructive",
};

export default function Pigeons() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterId = searchParams.get("filterId");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | Status>("all");
  const { t } = useTranslation();

  const savedFilters = useLiveQuery(() => db.filters.where("module").equals("pigeons").toArray()) ?? [];
  const activeFilter = useLiveQuery(() => (filterId ? db.filters.get(filterId) : undefined), [filterId]);

  useEffect(() => {
    seedIfEmpty();
  }, []);

  useEffect(() => {
    if (activeFilter?.query) {
      // Basic application of filter query: support 'status' and 'q'
      if (activeFilter.query.status) setTab(activeFilter.query.status);
      if (activeFilter.query.q) setQ(activeFilter.query.q);
    }
  }, [activeFilter]);

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{t("pigeons.title")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("pigeons.manage_loft", { count: all.length })}
          </p>
        </div>
      </div>

      {pendingSync > 0 && (
        <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-warning bg-warning/10 px-2 py-1 rounded-full">
          <CloudOff className="h-3 w-3" /> {t("pigeons.pending_sync", { count: pendingSync })}
        </div>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center gap-3 min-w-0 overflow-hidden">
          <Tabs value={tab} onValueChange={(v) => {
            setTab(v as typeof tab);
            if (filterId) {
              searchParams.delete("filterId");
              setSearchParams(searchParams);
            }
          }} className="w-full sm:w-auto min-w-0">
            <TabsList className="w-full justify-start sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">{t("pigeons.tab_all")}</TabsTrigger>
              <TabsTrigger value="breeder" className="flex-1 sm:flex-none">{t("pigeons.tab_breeders")}</TabsTrigger>
              <TabsTrigger value="racer" className="flex-1 sm:flex-none">{t("pigeons.tab_racers")}</TabsTrigger>
              <TabsTrigger value="young" className="flex-1 sm:flex-none">{t("pigeons.tab_young")}</TabsTrigger>
              <TabsTrigger value="lost" className="flex-1 sm:flex-none">{t("pigeons.tab_lost")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {savedFilters.length > 0 && (
              <Select 
                value={filterId || ""} 
                onValueChange={(v) => {
                  if (v === "none") {
                    searchParams.delete("filterId");
                  } else {
                    searchParams.set("filterId", v);
                  }
                  setSearchParams(searchParams);
                }}
              >
                <SelectTrigger className="flex-1 sm:w-[150px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t("sidebar.filters")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("pigeons.tab_all")}</SelectItem>
                  {savedFilters.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {filterId && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  searchParams.delete("filterId");
                  setSearchParams(searchParams);
                }}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative w-full md:max-w-[240px] shrink-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("pigeons.search_placeholder")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (filterId) {
                searchParams.delete("filterId");
                setSearchParams(searchParams);
              }
            }}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            {t("pigeons.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/pigeons/${p.id}`} className="group block min-w-0">
              <Card className="overflow-hidden shadow-soft transition-smooth hover:shadow-card flex flex-row items-center h-20 sm:h-auto sm:flex-col min-w-0">
                <div className="w-20 h-full sm:w-full sm:aspect-[4/3] overflow-hidden bg-secondary shrink-0">
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-smooth group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground text-[10px]">
                      {t("pigeons.no_image")}
                    </div>
                  )}
                </div>
                <CardContent className="flex-1 flex flex-col justify-center p-2.5 sm:p-4 min-w-0 overflow-hidden">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10px] sm:text-[11px] uppercase text-muted-foreground truncate leading-tight">
                        {p.ringNumber}
                      </p>
                      <h3 className="font-semibold text-sm sm:text-base truncate">{p.name || "—"}</h3>
                    </div>
                    <Badge variant="secondary" className={`shrink-0 border-0 capitalize text-[9px] sm:text-[11px] px-1.5 py-0 sm:px-2.5 sm:py-0.5 ${statusStyles[p.status]}`}>
                      {t(`status.${p.status}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mt-1">
                    <span className="truncate mr-2">{p.color || "—"}</span>
                    <span className="shrink-0">{p.bornYear ?? "—"}</span>
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
