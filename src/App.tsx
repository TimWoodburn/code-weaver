// path: src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GeneratedDataProvider } from "@/contexts/GeneratedDataContext";
import Index from "./pages/Index";
import Artifacts from "./pages/Artifacts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GeneratedDataProvider>
        <Toaster />
        <Sonner />

        {/* Full-height app shell */}
        <div className="min-h-screen flex flex-col">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/artifacts" element={<Artifacts />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </GeneratedDataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
