import { AppLayout } from '@/components/layout/AppLayout';
import { Landing } from '@/pages/Landing';
import { Privacy } from '@/pages/Privacy';
import { Login } from '@/pages/Login';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useAuthStore } from '@/store/auth.store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, type ComponentType, type ReactNode } from 'react';

const CHUNK_RELOAD_KEY = 'fieldops_chunk_reload';

/**
 * Load a page on demand. After a deploy, an open tab may request a chunk
 * that no longer exists; reload once to pick up the new build.
 */
function lazyPage<M>(load: () => Promise<M>, pick: (m: M) => ComponentType) {
  return lazy(() =>
    load()
      .then((m) => {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        return { default: pick(m) };
      })
      .catch((err) => {
        if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
          window.location.reload();
        }
        throw err;
      }),
  );
}

const AppUsers = lazyPage(() => import('@/pages/admin/AppUsers'), (m) => m.AppUsers);
const Brands = lazyPage(() => import('@/pages/admin/Brands'), (m) => m.Brands);
const CatalogImport = lazyPage(() => import('@/pages/admin/CatalogImport'), (m) => m.CatalogImport);
const Outlets = lazyPage(() => import('@/pages/admin/Outlets'), (m) => m.Outlets);
const Products = lazyPage(() => import('@/pages/admin/Products'), (m) => m.Products);
const UnknownSenders = lazyPage(() => import('@/pages/admin/UnknownSenders'), (m) => m.UnknownSenders);
const Users = lazyPage(() => import('@/pages/admin/Users'), (m) => m.Users);
const Dashboard = lazyPage(() => import('@/pages/Dashboard'), (m) => m.Dashboard);
const MerchandiserDashboard = lazyPage(() => import('@/pages/dashboard/MerchandiserDashboard'), (m) => m.MerchandiserDashboard);
const MessageLog = lazyPage(() => import('@/pages/messages/MessageLog'), (m) => m.MessageLog);
const PromoterDashboardPage = lazyPage(() => import('@/pages/PromoterDashboardPage'), (m) => m.PromoterDashboardPage);
const MerchandiserReportDetail = lazyPage(() => import('@/pages/reports/MerchandiserReportDetail'), (m) => m.MerchandiserReportDetail);
const MerchandiserReports = lazyPage(() => import('@/pages/reports/MerchandiserReports'), (m) => m.MerchandiserReports);
const PromoterReportDetail = lazyPage(() => import('@/pages/reports/PromoterReportDetail'), (m) => m.PromoterReportDetail);
const PromoterReports = lazyPage(() => import('@/pages/reports/PromoterReports'), (m) => m.PromoterReports);
const ReviewDetail = lazyPage(() => import('@/pages/review/ReviewDetail'), (m) => m.ReviewDetail);
const ReviewQueue = lazyPage(() => import('@/pages/review/ReviewQueue'), (m) => m.ReviewQueue);
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
  { path: '/privacy', element: <Privacy /> },
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
