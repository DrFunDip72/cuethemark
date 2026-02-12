import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SubscriptionGate } from "./components/SubscriptionGate";
import { Navigation } from "./components/Navigation";
import { BottomNav } from "./components/BottomNav";
import { NotificationModal } from "./components/NotificationModal";
import { useNotifications } from "./hooks/useNotifications";
import UploadPage from "./pages/UploadPage";
import TrackPage from "./pages/TrackPage";
import ProfilePage from "./pages/ProfilePage";
import SuccessPage from "./pages/SuccessPage";
import AdminPage from "./pages/AdminPage";
import ErrorDashboardPage from "./pages/admin/ErrorDashboardPage";
import AnalyticsDashboardPage from "./pages/admin/AnalyticsDashboardPage";
import ReferralsDashboardPage from "./pages/admin/ReferralsDashboardPage";
import FeatureTrackerPage from "./pages/admin/FeatureTrackerPage";
import ArchivedFeaturesPage from "./pages/admin/ArchivedFeaturesPage";
import NotificationsCenterPage from "./pages/admin/NotificationsCenterPage";
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

const AppContent = () => {
  const { notification, isOpen, closeNotification } = useNotifications();

  return (
    <>
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
                  <div className="landing-theme min-h-screen flex flex-col" data-theme="landing">
                    <Navigation />
                    <main className="flex-1 bg-background text-foreground pb-20 md:pb-0">
                      <Outlet />
                    </main>
                    <BottomNav />
                  </div>
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
            <Route
              path="/app/admin/errors"
              element={
                <AdminRoute>
                  <ErrorDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/app/admin/analytics"
              element={
                <AdminRoute>
                  <AnalyticsDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/app/admin/referrals"
              element={
                <AdminRoute>
                  <ReferralsDashboardPage />
                </AdminRoute>
              }
            />
            <Route
              path="/app/admin/features"
              element={
                <AdminRoute>
                  <FeatureTrackerPage />
                </AdminRoute>
              }
            />
            <Route
              path="/app/admin/features/archived"
              element={
                <AdminRoute>
                  <ArchivedFeaturesPage />
                </AdminRoute>
              }
            />
            <Route
              path="/app/admin/notifications"
              element={
                <AdminRoute>
                  <NotificationsCenterPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {notification && (
        <NotificationModal
          notification={notification}
          open={isOpen}
          onClose={closeNotification}
        />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
