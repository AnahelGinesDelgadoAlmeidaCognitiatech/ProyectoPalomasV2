import { NavLink, useLocation } from "react-router-dom";
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

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }>; badge?: string };
type Group = { label: string; icon: React.ComponentType<{ className?: string }>; items: Item[] };

const groups: Group[] = [
  {
    label: "Pigeons", icon: Bird, items: [
      { title: "My Pigeons", url: "/pigeons", icon: Bird },
      { title: "Create New Pigeon", url: "/pigeons/new", icon: Plus },
      { title: "Pedigree Scan", url: "/pedigree-scan", icon: ScanLine, badge: "AI" },
      { title: "Statistics", url: "/statistics", icon: BarChart3 },
      { title: "Images", url: "/images", icon: ImageIcon },
      { title: "Public Pigeons", url: "/public", icon: Globe },
      { title: "Transfers", url: "/transfers", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Breeding", icon: Heart, items: [
      { title: "Seasons", url: "/seasons", icon: CalendarDays },
      { title: "Pairs", url: "/pairs", icon: Heart },
    ],
  },
  {
    label: "Racing", icon: Trophy, items: [
      { title: "Races", url: "/races", icon: Trophy },
      { title: "Distance Calculator", url: "/distance", icon: Ruler },
      { title: "Speed Calculator", url: "/speed", icon: Gauge },
      { title: "Road Trainer", url: "/trainer", icon: Radio },
    ],
  },
  {
    label: "Stations", icon: MapPinned, items: [
      { title: "Stations", url: "/stations", icon: MapPinned },
      { title: "My Loft", url: "/loft", icon: Home },
    ],
  },
  {
    label: "Journals", icon: BookOpen, items: [
      { title: "Daily Journal", url: "/journal", icon: BookOpen },
      { title: "Medications", url: "/medications", icon: Pill },
      { title: "Pigeon Comments", url: "/comments/pigeon", icon: MessageSquare },
      { title: "Pair Comments", url: "/comments/pair", icon: MessageSquare },
      { title: "Team Comments", url: "/comments/team", icon: MessageSquare },
    ],
  },
  {
    label: "Settings", icon: Settings, items: [
      { title: "General Options", url: "/settings/general", icon: Settings },
      { title: "Pedigree Options", url: "/settings/pedigree", icon: FileText },
      { title: "Information Card Options", url: "/settings/card", icon: IdCard },
      { title: "Band Collections", url: "/settings/bands", icon: Database },
      { title: "Autocomplete Values", url: "/settings/autocomplete", icon: Tags },
      { title: "Filters", url: "/settings/filters", icon: Filter },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
                  <NavLink to="/" end>
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/contacts")}>
                  <NavLink to="/contacts">
                    <Contact2 className="h-4 w-4" />
                    <span>Contacts</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/teams")}>
                  <NavLink to="/teams">
                    <Users className="h-4 w-4" />
                    <span>Teams</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {groups.map((g) => (
          <Collapsible key={g.label} defaultOpen={groupHasActive(g) || g.label === "Pigeons"} className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wide hover:text-foreground">
                  <g.icon className="h-3.5 w-3.5" />
                  <span>{g.label}</span>
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
                            <span className="flex-1">{item.title}</span>
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
