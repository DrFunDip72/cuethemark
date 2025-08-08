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
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

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
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Success page after checkout */}
              <Route
                path="/success"
                element={
                  <ProtectedRoute>
                    <SuccessPage />
                  </ProtectedRoute>
                }
              />

              {/* App routes */}
              <Route
                path="/app/*"
                element={
                  <ProtectedRoute>
                    <SubscriptionGate>
                      <Navigation />
                      <main className="flex-1 bg-gray-50">
                        <Routes>
                          <Route path="/app" element={<UploadPage />} />
                          <Route path="/app/tracks" element={<UploadPage />} />
                          <Route path="/app/tracks/:id" element={<TrackPage />} />
                          <Route path="/app/profile" element={<ProfilePage />} />
                          <Route
                            path="/app/admin"
                            element={
                              <AdminRoute>
                                <AdminPage />
                              </AdminRoute>
                            }
                          />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </SubscriptionGate>
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
