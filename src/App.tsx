import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./layouts/AppLayout";
import Index from "./pages/Index";
import Pigeons from "./pages/Pigeons";
import PigeonDetail from "./pages/PigeonDetail";
import Placeholder from "./pages/Placeholder";
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
            <Route path="/pigeons" element={<Pigeons />} />
            <Route path="/pigeons/:id" element={<PigeonDetail />} />
            <Route path="/pedigree" element={<Placeholder title="Pedigree explorer" />} />
            <Route path="/lofts" element={<Placeholder title="Lofts" />} />
            <Route path="/races" element={<Placeholder title="Races" />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
