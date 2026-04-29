import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ScanLine, BarChart3, Image as ImageIcon, Globe, ArrowLeftRight, Plus,
  CalendarDays, Heart, Users, Trophy, Ruler, Gauge, Radio, MapPinned, Home,
  BookOpen, Pill, MessageSquare, Contact2, Settings, FileText, IdCard, Database, Tags, Filter,
} from "lucide-react";
import AppLayout from "./layouts/AppLayout";
import Index from "./pages/Index";
import Pigeons from "./pages/Pigeons";
import PigeonDetail from "./pages/PigeonDetail";
import PigeonEdit from "./pages/PigeonEdit";
import ModulePage from "./pages/ModulePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />

            {/* Pigeons */}
            <Route path="/pigeons" element={<Pigeons />} />
            <Route path="/pigeons/new" element={<PigeonEdit />} />
            <Route path="/pigeons/:id" element={<PigeonDetail />} />
            <Route path="/pigeons/:id/edit" element={<PigeonEdit />} />
            <Route path="/pedigree-scan" element={<ModulePage title="Pedigree Scan (AI)" description="Scan a paper pedigree and let AI extract bands, parents and notes." icon={ScanLine} features={["Image / PDF upload", "AI band recognition", "Auto-link to existing pigeons", "Confidence scoring", "Manual review & edit"]} />} />
            <Route path="/statistics" element={<ModulePage title="Statistics" description="Performance analytics across your loft." icon={BarChart3} features={["Wins by season", "Distance distribution", "Best breeders heatmap", "Inbreeding trends", "Speed averages"]} />} />
            <Route path="/images" element={<ModulePage title="Images" description="All photos across your pigeons in one gallery." icon={ImageIcon} features={["Filter by pigeon", "Lightbox viewer", "Bulk upload", "Captions & dates"]} />} />
            <Route path="/public" element={<ModulePage title="Public Pigeons" description="Browse pigeons shared by other fanciers worldwide." icon={Globe} features={["Search by band", "Country filters", "Pedigree lookup", "Contact owner"]} />} />
            <Route path="/transfers" element={<ModulePage title="Transfers" description="Manage incoming and outgoing pigeon transfers." icon={ArrowLeftRight} features={["Send to fancier", "Receive request inbox", "Transfer history", "Documentation export"]} />} />

            {/* Breeding */}
            <Route path="/seasons" element={<ModulePage title="Seasons" description="Plan and track your breeding seasons." icon={CalendarDays} features={["Year-by-year overview", "Round numbering", "Pair assignments", "Egg & hatch tracking"]} />} />
            <Route path="/pairs" element={<ModulePage title="Pairs" description="Active breeding pairs and their nest history." icon={Heart} features={["Active pairs grid", "Compatibility scoring", "Offspring listing", "Notes per pair"]} />} />

            {/* Teams & Contacts */}
            <Route path="/teams" element={<ModulePage title="Teams" description="Group your pigeons into race teams." icon={Users} features={["Create teams", "Assign pigeons", "Per-team statistics", "Team comments"]} />} />
            <Route path="/contacts" element={<ModulePage title="Contacts" description="Your network of fanciers and clubs." icon={Contact2} features={["Address book", "Country grouping", "Last transfer tracking", "Quick message"]} />} />

            {/* Racing */}
            <Route path="/races" element={<ModulePage title="Races" description="Create and manage races, results and clocking." icon={Trophy} features={["Race creation", "Basket / clock entry", "Auto results", "Per-pigeon position", "Velocity calculation"]} />} />
            <Route path="/distance" element={<ModulePage title="Distance Calculator" description="Compute great-circle distance between loft and station." icon={Ruler} features={["Coordinates input", "Map preview", "Multiple lofts", "Save to race"]} />} />
            <Route path="/speed" element={<ModulePage title="Speed Calculator" description="Compute pigeon velocity from distance and time." icon={Gauge} features={["m/min and yards/min", "Compare birds", "Wind compensation"]} />} />
            <Route path="/trainer" element={<ModulePage title="Road Trainer" description="Plan training tosses and track progress." icon={Radio} features={["Toss schedule", "Distance progression", "Lost-bird notes", "Weather log"]} />} />

            {/* Stations */}
            <Route path="/stations" element={<ModulePage title="Stations" description="Liberation stations with coordinates." icon={MapPinned} features={["Station catalog", "Map view", "Distance from your loft", "Frequently used"]} />} />
            <Route path="/loft" element={<ModulePage title="My Loft" description="Your loft details and coordinates." icon={Home} features={["Coordinates", "Loft photo", "Capacity", "Multiple lofts"]} />} />

            {/* Journals */}
            <Route path="/journal" element={<ModulePage title="Daily Journal" description="Daily notes about your loft." icon={BookOpen} features={["Date timeline", "Tag entries", "Attach images", "Search"]} />} />
            <Route path="/medications" element={<ModulePage title="Medications" description="Treatment log across your loft." icon={Pill} features={["Per-bird and group treatments", "Withdrawal periods", "Recurring schedules", "Veterinary contacts"]} />} />
            <Route path="/comments/pigeon" element={<ModulePage title="Pigeon Comments" description="All comments across pigeons." icon={MessageSquare} />} />
            <Route path="/comments/pair" element={<ModulePage title="Pair Comments" description="All comments across breeding pairs." icon={MessageSquare} />} />
            <Route path="/comments/team" element={<ModulePage title="Team Comments" description="All comments across teams." icon={MessageSquare} />} />

            {/* Settings */}
            <Route path="/settings/general" element={<ModulePage title="General Options" description="Units, language, defaults." icon={Settings} features={["Distance units", "Date format", "Default loft", "Theme"]} />} />
            <Route path="/settings/pedigree" element={<ModulePage title="Pedigree Options" description="Customize the pedigree print layout." icon={FileText} features={["3 / 4 / 5 generations", "Show photos", "Color theme", "Header logo"]} />} />
            <Route path="/settings/card" element={<ModulePage title="Information Card Options" description="Per-pigeon card layout." icon={IdCard} />} />
            <Route path="/settings/bands" element={<ModulePage title="Band Collections" description="Manage your registered band series." icon={Database} features={["Country prefix", "Year ranges", "Bulk add", "Reservation"]} />} />
            <Route path="/settings/autocomplete" element={<ModulePage title="Autocomplete Values" description="Manage the dropdown values used across the app." icon={Tags} features={["Colors", "Statuses", "Markings", "Family names"]} />} />
            <Route path="/settings/filters" element={<ModulePage title="Filters" description="Saved filters for the pigeon list." icon={Filter} />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
