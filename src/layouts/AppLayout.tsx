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
            <SidebarTrigger />
            <form onSubmit={submitSearch} className="relative hidden flex-1 max-w-md md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("layout.search_placeholder")}
                className="pl-9"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && matches.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                  {matches.map((p) => (
                    <Link
                      key={p.id}
                      to={`/pigeons/${p.id}`}
                      onClick={() => setQ("")}
                      className="flex items-center justify-between gap-3 rounded-sm px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="truncate">{p.name || "—"}</span>
                      <span className="font-mono text-xs text-muted-foreground">{p.ringNumber}</span>
                    </Link>
                  ))}
                </div>
              )}
            </form>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={t("layout.notifications")} className="relative">
                    <Bell className="h-4 w-4" />
                    {pending > 0 && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-warning" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>{t("layout.notifications")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {pending > 0 ? (
                    <DropdownMenuItem className="gap-2">
                      <CloudOff className="h-4 w-4 text-warning" />
                      <span>{t("layout.pending_changes", { count: pending })}</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="gap-2 text-muted-foreground">
                      <Check className="h-4 w-4 text-success" />
                      <span>{t("layout.all_synced")}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button asChild size="sm" className="gap-2">
                <Link to="/pigeons/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("layout.add_pigeon")}</span>
                </Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
