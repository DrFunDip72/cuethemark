
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SubscriptionGate } from "./components/SubscriptionGate";
import { Navigation } from "./components/Navigation";
import UploadPage from "./pages/UploadPage";
import TrackPage from "./pages/TrackPage";

import ProfilePage from "./pages/ProfilePage";
import SuccessPage from "./pages/SuccessPage";
import AdminPage from "./pages/AdminPage";
import { AdminRoute } from "./components/AdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Routes>
              <Route path="/success" element={
                <ProtectedRoute>
                  <SuccessPage />
                </ProtectedRoute>
              } />
              <Route path="/*" element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <Navigation />
                    <main className="flex-1 bg-gray-50">
                      <Routes>
                        <Route path="/" element={<UploadPage />} />
                        <Route path="/tracks" element={<UploadPage />} />
                        <Route path="/tracks/:id" element={<TrackPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/admin" element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </SubscriptionGate>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
