import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
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
import GetStartedPage from "./pages/GetStartedPage";
import FeedbackPage from "./pages/FeedbackPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";

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
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/get-started" element={<GetStartedPage />} />
              <Route path="/signup" element={<GetStartedPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              {/* Protected app and success routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <SubscriptionGate>
                      <Navigation />
                      <main className="flex-1 bg-gray-50">
                        <Outlet />
                      </main>
                    </SubscriptionGate>
                  </ProtectedRoute>
                }
              >
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/app" element={<UploadPage />} />
                <Route path="/app/tracks" element={<UploadPage />} />
                <Route path="/app/tracks/:id" element={<TrackPage />} />
                <Route path="/tracks/:id" element={<TrackPage />} />
                <Route path="/app/profile" element={<ProfilePage />} />
                <Route path="/app/feedback" element={<FeedbackPage />} />
                <Route
                  path="/app/admin"
                  element={
                    <AdminRoute>
                      <AdminPage />
                    </AdminRoute>
                  }
                />
              </Route>

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
