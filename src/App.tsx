import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  ScanLine, Image as ImageIcon, Globe, ArrowLeftRight, Radio,
} from "lucide-react";
import AppLayout from "./layouts/AppLayout";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index";
import Pigeons from "./pages/Pigeons";
import PigeonDetail from "./pages/PigeonDetail";
import PigeonEdit from "./pages/PigeonEdit";
import Pairs from "./pages/Pairs";
import Seasons from "./pages/Seasons";
import Races from "./pages/Races";
import Teams from "./pages/Teams";
import Contacts from "./pages/Contacts";
import Stations from "./pages/Stations";
import MyLoft from "./pages/MyLoft";
import Journal from "./pages/Journal";
import Medications from "./pages/Medications";
import CommentsPage from "./pages/CommentsPage";
import Bands from "./pages/Bands";
import Autocomplete from "./pages/Autocomplete";
import Filters from "./pages/Filters";
import DistanceCalc from "./pages/DistanceCalc";
import SpeedCalc from "./pages/SpeedCalc";
import Statistics from "./pages/Statistics";
import Images from "./pages/Images";
import ComingSoonPage from "./pages/ComingSoonPage";
import { GeneralSettings, PedigreeSettings, CardSettings } from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { t } = useTranslation();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/images" element={<Images />} />
                <Route path="/pedigree-scan" element={<ComingSoonPage title={t('sidebar.pedigree_scan')} description={t('sidebar.pedigree_scan_desc')} icon={ScanLine} features={t('sidebar.pedigree_scan_features', { returnObjects: true }) as string[]} />} />
                <Route path="/public" element={<ComingSoonPage title={t('sidebar.public_pigeons')} description={t('sidebar.public_pigeons_desc')} icon={Globe} features={t('sidebar.public_pigeons_features', { returnObjects: true }) as string[]} />} />
                {/* <Route path="/transfers" element={<ComingSoonPage title={t('sidebar.transfers')} description={t('sidebar.transfers_desc')} icon={ArrowLeftRight} features={t('sidebar.transfers_features', { returnObjects: true }) as string[]} />} /> */}

                {/* Breeding */}
                <Route path="/seasons" element={<Seasons />} />
                <Route path="/pairs" element={<Pairs />} />

                {/* Teams & Contacts */}
                <Route path="/teams" element={<Teams />} />
                <Route path="/contacts" element={<Contacts />} />

                {/* Racing */}
                <Route path="/races" element={<Races />} />
                <Route path="/distance" element={<DistanceCalc />} />
                <Route path="/speed" element={<SpeedCalc />} />
                <Route path="/trainer" element={<ComingSoonPage title={t('sidebar.road_trainer')} description={t('sidebar.road_trainer_desc')} icon={Radio} features={t('sidebar.road_trainer_features', { returnObjects: true }) as string[]} />} />

                {/* Stations */}
                <Route path="/stations" element={<Stations />} />
                <Route path="/loft" element={<MyLoft />} />

                {/* Journals */}
                <Route path="/journal" element={<Journal />} />
                <Route path="/medications" element={<Medications />} />
                <Route path="/comments/pigeon" element={<CommentsPage target="pigeon" title={t('sidebar.pigeon_comments')} />} />
                <Route path="/comments/pair" element={<CommentsPage target="pair" title={t('sidebar.pair_comments')} />} />
                <Route path="/comments/team" element={<CommentsPage target="team" title={t('sidebar.team_comments')} />} />

                {/* Settings */}
                <Route path="/settings/general" element={<GeneralSettings />} />
                <Route path="/settings/pedigree" element={<PedigreeSettings />} />
                <Route path="/settings/card" element={<CardSettings />} />
                <Route path="/settings/bands" element={<Bands />} />
                <Route path="/settings/autocomplete" element={<Autocomplete />} />
                <Route path="/settings/filters" element={<Filters />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
