import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bird, Plus, ScanLine, BarChart3, Image as ImageIcon, Globe, ArrowLeftRight,
  Heart, CalendarDays, Users, Trophy, Ruler, Gauge, MapPinned, Radio, Home,
  BookOpen, Pill, MessageSquare, Contact2, Settings, Filter, Tags, Database,
  FileText, IdCard, LayoutDashboard,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import pigeonLogo from "@/assets/pigeon-hero.png";

type Item = { titleKey: string; url: string; icon: React.ComponentType<{ className?: string }>; badge?: string };
type Group = { labelKey: string; icon: React.ComponentType<{ className?: string }>; items: Item[] };

const groups: Group[] = [
  {
    labelKey: "sidebar.pigeons", icon: Bird, items: [
      { titleKey: "sidebar.my_pigeons", url: "/pigeons", icon: Bird },
      { titleKey: "sidebar.create_new_pigeon", url: "/pigeons/new", icon: Plus },
      { titleKey: "sidebar.pedigree_scan", url: "/pedigree-scan", icon: ScanLine, badge: "AI" },
      { titleKey: "sidebar.statistics", url: "/statistics", icon: BarChart3 },
      { titleKey: "sidebar.images", url: "/images", icon: ImageIcon },
      // { titleKey: "sidebar.public_pigeons", url: "/public", icon: Globe },
      // { titleKey: "sidebar.transfers", url: "/transfers", icon: ArrowLeftRight },
    ],
  },
  {
    labelKey: "sidebar.breeding", icon: Heart, items: [
      { titleKey: "sidebar.seasons", url: "/seasons", icon: CalendarDays },
      { titleKey: "sidebar.pairs", url: "/pairs", icon: Heart },
    ],
  },
  {
    labelKey: "sidebar.racing", icon: Trophy, items: [
      { titleKey: "sidebar.races", url: "/races", icon: Trophy },
      { titleKey: "sidebar.distance_calculator", url: "/distance", icon: Ruler },
      { titleKey: "sidebar.speed_calculator", url: "/speed", icon: Gauge },
      { titleKey: "sidebar.road_trainer", url: "/trainer", icon: Radio },
    ],
  },
  {
    labelKey: "sidebar.stations_group", icon: MapPinned, items: [
      { titleKey: "sidebar.stations", url: "/stations", icon: MapPinned },
      { titleKey: "sidebar.my_loft", url: "/loft", icon: Home },
    ],
  },
  {
    labelKey: "sidebar.journals", icon: BookOpen, items: [
      { titleKey: "sidebar.daily_journal", url: "/journal", icon: BookOpen },
      { titleKey: "sidebar.medications", url: "/medications", icon: Pill },
      { titleKey: "sidebar.pigeon_comments", url: "/comments/pigeon", icon: MessageSquare },
      { titleKey: "sidebar.pair_comments", url: "/comments/pair", icon: MessageSquare },
      { titleKey: "sidebar.team_comments", url: "/comments/team", icon: MessageSquare },
    ],
  },
  {
    labelKey: "sidebar.settings", icon: Settings, items: [
      { titleKey: "sidebar.general_options", url: "/settings/general", icon: Settings },
      { titleKey: "sidebar.pedigree_options", url: "/settings/pedigree", icon: FileText },
      { titleKey: "sidebar.card_options", url: "/settings/card", icon: IdCard },
      { titleKey: "sidebar.bands", url: "/settings/bands", icon: Database },
      { titleKey: "sidebar.autocomplete", url: "/settings/autocomplete", icon: Tags },
      { titleKey: "sidebar.filters", url: "/settings/filters", icon: Filter },
    ],
  },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t } = useTranslation();

  const handleNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname === path || location.pathname.startsWith(path + "/");

  const groupHasActive = (g: Group) => g.items.some((i) => isActive(i.url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-hero shadow-elegant">
            <img src={pigeonLogo} alt="" className="h-7 w-7" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">PigeonDB</span>
              <span className="text-xs text-muted-foreground">Loft Manager</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <NavLink to="/" end onClick={handleNav}>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>{t("sidebar.dashboard")}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/contacts")}>
                  <NavLink to="/contacts" onClick={handleNav}>
                    <Contact2 className="h-4 w-4" />
                    <span>{t("sidebar.contacts")}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/teams")}>
                  <NavLink to="/teams" onClick={handleNav}>
                    <Users className="h-4 w-4" />
                    <span>{t("sidebar.teams")}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map((g) => (
          <Collapsible key={g.labelKey} defaultOpen={groupHasActive(g) || g.labelKey === "sidebar.pigeons"} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wide hover:text-foreground">
                  <g.icon className="h-3.5 w-3.5" />
                  <span>{t(g.labelKey)}</span>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-data-[state=closed]/collapsible:-rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((item) => (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={isActive(item.url)} size="sm">
                          <NavLink to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1">{t(item.titleKey)}</span>
                            {item.badge && (
                              <span className="rounded-md bg-gradient-hero px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                                {item.badge}
                              </span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
