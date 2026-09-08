import { AppLayout } from '@/components/layout/AppLayout';
import { AppUsers } from '@/pages/admin/AppUsers';
import { Brands } from '@/pages/admin/Brands';
import { CatalogImport } from '@/pages/admin/CatalogImport';
import { Outlets } from '@/pages/admin/Outlets';
import { Products } from '@/pages/admin/Products';
import { UnknownSenders } from '@/pages/admin/UnknownSenders';
import { Users } from '@/pages/admin/Users';
import { Dashboard } from '@/pages/Dashboard';
import { MerchandiserDashboard } from '@/pages/dashboard/MerchandiserDashboard';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { MessageLog } from '@/pages/messages/MessageLog';
import { PromoterDashboardPage } from '@/pages/PromoterDashboardPage';
import { MerchandiserReportDetail } from '@/pages/reports/MerchandiserReportDetail';
import { MerchandiserReports } from '@/pages/reports/MerchandiserReports';
import { PromoterReportDetail } from '@/pages/reports/PromoterReportDetail';
import { PromoterReports } from '@/pages/reports/PromoterReports';
import { ReviewDetail } from '@/pages/review/ReviewDetail';
import { ReviewQueue } from '@/pages/review/ReviewQueue';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useAuthStore } from '@/store/auth.store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function LoginGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Login />;
}

function CatchAll() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />;
}

function SuperAdminOnly({ children }: { children: ReactNode }) {
  const ok = useAuthStore((s) => s.hasRole('super_admin'));
  if (!ok) return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardPromoterRoles({ children }: { children: ReactNode }) {
  const ok = useAuthStore((s) => s.hasRole('super_admin', 'supervisor'));
  if (!ok) return <Navigate to="/dashboard" replace />;
  return children;
}

// Brand managers are, for now, limited to Dashboard + Stock Dashboard only.
function BlockBrandManager({ children }: { children: ReactNode }) {
  const isBrandManager = useAuthStore(
    (s) => s.user?.role === 'brand_manager',
  );
  if (isBrandManager) return <Navigate to="/dashboard" replace />;
  return children;
}

export const router = createBrowserRouter([
  // Public marketing page — always renders at the bare root, regardless
  // of auth state. Login lives at /login; the authenticated app lives
  // under its own paths below (starting with /dashboard).
  { path: '/', element: <Landing /> },
  { path: '/login', element: <LoginGate /> },
  {
    // Pathless layout route: guards every child path below without
    // claiming "/" itself, so it never competes with the Landing route.
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <Dashboard /> },
          {
            path: 'review',
            element: (
              <BlockBrandManager>
                <ReviewQueue />
              </BlockBrandManager>
            ),
          },
          {
            path: 'review/:id',
            element: (
              <BlockBrandManager>
                <ReviewDetail />
              </BlockBrandManager>
            ),
            errorElement: (
              <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-slate-900 mb-2">
                    Failed to load report
                  </h2>
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            ),
          },
          {
            path: 'messages',
            element: (
              <BlockBrandManager>
                <MessageLog />
              </BlockBrandManager>
            ),
          },
          {
            path: 'dashboard/merchandiser',
            element: <MerchandiserDashboard />,
          },
          {
            path: 'dashboard/promoter',
            element: (
              <DashboardPromoterRoles>
                <PromoterDashboardPage />
              </DashboardPromoterRoles>
            ),
          },
          {
            path: 'reports/merchandiser',
            element: (
              <BlockBrandManager>
                <MerchandiserReports />
              </BlockBrandManager>
            ),
          },
          {
            path: 'reports/merchandiser/:id',
            element: (
              <BlockBrandManager>
                <MerchandiserReportDetail />
              </BlockBrandManager>
            ),
          },
          {
            path: 'reports/promoter',
            element: (
              <BlockBrandManager>
                <PromoterReports />
              </BlockBrandManager>
            ),
          },
          {
            path: 'reports/promoter/:id',
            element: (
              <BlockBrandManager>
                <PromoterReportDetail />
              </BlockBrandManager>
            ),
          },
          {
            path: 'admin/brands',
            element: (
              <SuperAdminOnly>
                <Brands />
              </SuperAdminOnly>
            ),
          },
          {
            path: 'admin/users',
            element: (
              <SuperAdminOnly>
                <Users />
              </SuperAdminOnly>
            ),
          },
          {
            path: 'admin/unknown-senders',
            element: (
              <SuperAdminOnly>
                <UnknownSenders />
              </SuperAdminOnly>
            ),
          },
          {
            path: 'admin/outlets',
            element: (
              <SuperAdminOnly>
                <Outlets />
              </SuperAdminOnly>
            ),
          },
          {
            path: 'admin/products',
            element: (
              <SuperAdminOnly>
                <Products />
              </SuperAdminOnly>
            ),
          },
          {
            path: 'admin/catalog-import',
            element: (
              <SuperAdminOnly>
                <CatalogImport />
              </SuperAdminOnly>
            ),
          },
          {
            path: 'admin/app-users',
            element: (
              <SuperAdminOnly>
                <AppUsers />
              </SuperAdminOnly>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <CatchAll /> },
]);

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
