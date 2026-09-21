import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import { Spinner } from '@/components/Spinner';
import LandingPage from '@/pages/LandingPage';

// The landing page ships alone; everything else loads on demand.
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RoutinesPage = lazy(() => import('@/pages/RoutinesPage'));
const RoutineEditorPage = lazy(() => import('@/pages/RoutineEditorPage'));
const SharedRoutinePage = lazy(() => import('@/pages/SharedRoutinePage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Spinner fullScreen />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/r/:shareId" element={<SharedRoutinePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<RoutinesPage />} />
              <Route path="routines/:id" element={<RoutineEditorPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster theme="dark" position="top-center" />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
