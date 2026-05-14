import { Link, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Bell, CloudOff, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { db, seedIfEmpty } from "@/lib/db";

export default function AppLayout() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { t } = useTranslation();

  useEffect(() => { seedIfEmpty(); }, []);

  const pending = useLiveQuery(() => db.syncQueue.filter((i) => !i.syncedAt).count(), []) ?? 0;
  const matches = useLiveQuery(async () => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const all = await db.pigeons.toArray();
    return all
      .filter((p) =>
        p.name.toLowerCase().includes(needle) ||
        p.ringNumber.toLowerCase().includes(needle) ||
        p.loft.toLowerCase().includes(needle)
      )
      .slice(0, 8);
  }, [q]) ?? [];

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (matches[0]) navigate(`/pigeons/${matches[0].id}`);
    else navigate(`/pigeons`);
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-subtle">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger className="-ml-1 sm:ml-0" />
            <form onSubmit={submitSearch} className="relative flex-1 max-w-[140px] xs:max-w-xs md:max-w-md mx-1">
              <Search className="pointer-events-none absolute left-2 sm:left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("layout.search_placeholder")}
                className="pl-7 sm:pl-9 h-9 sm:h-10 text-xs sm:text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && matches.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg z-50">
                  {matches.map((p) => (
                    <Link
                      key={p.id}
                      to={`/pigeons/${p.id}`}
                      onClick={() => setQ("")}
                      className="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-xs sm:text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="truncate">{p.name || "—"}</span>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">{p.ringNumber}</span>
                    </Link>
                  ))}
                </div>
              )}
            </form>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden xs:block">
                <ThemeToggle />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t("layout.notifications")} className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {pending > 0 && (
                      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-warning" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 sm:w-72">
                  <DropdownMenuLabel className="text-xs sm:text-sm">{t("layout.notifications")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {pending > 0 ? (
                    <DropdownMenuItem className="gap-2 text-xs sm:text-sm">
                      <CloudOff className="h-4 w-4 text-warning" />
                      <span>{t("layout.pending_changes", { count: pending })}</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="gap-2 text-muted-foreground text-xs sm:text-sm">
                      <Check className="h-4 w-4 text-success" />
                      <span>{t("layout.all_synced")}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild size="sm" className="h-9 px-2 sm:px-3 gap-2">
                <Link to="/pigeons/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">{t("layout.add_pigeon")}</span>
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
