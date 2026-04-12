import { AppLayout } from '@/components/layout/AppLayout';
import { Brands } from '@/pages/admin/Brands';
import { Outlets } from '@/pages/admin/Outlets';
import { Products } from '@/pages/admin/Products';
import { Users } from '@/pages/admin/Users';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { MessageLog } from '@/pages/messages/MessageLog';
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
    return <Navigate to="/" replace />;
  }
  return <Login />;
}

function SuperAdminOnly({ children }: { children: ReactNode }) {
  const ok = useAuthStore((s) => s.hasRole('super_admin'));
  if (!ok) return <Navigate to="/" replace />;
  return children;
}

function BrandManagerPlus({ children }: { children: ReactNode }) {
  const ok = useAuthStore((s) =>
    s.hasRole('super_admin', 'brand_manager'),
  );
  if (!ok) return <Navigate to="/" replace />;
  return children;
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginGate /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'review', element: <ReviewQueue /> },
          {
            path: 'review/:id',
            element: <ReviewDetail />,
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
          { path: 'messages', element: <MessageLog /> },
          {
            path: 'reports/merchandiser',
            element: <MerchandiserReports />,
          },
          {
            path: 'reports/merchandiser/:id',
            element: <MerchandiserReportDetail />,
          },
          {
            path: 'reports/promoter',
            element: <PromoterReports />,
          },
          {
            path: 'reports/promoter/:id',
            element: <PromoterReportDetail />,
          },
          {
            path: 'admin/brands',
            element: (
              <BrandManagerPlus>
                <Brands />
              </BrandManagerPlus>
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
            path: 'admin/outlets',
            element: (
              <BrandManagerPlus>
                <Outlets />
              </BrandManagerPlus>
            ),
          },
          {
            path: 'admin/products',
            element: (
              <BrandManagerPlus>
                <Products />
              </BrandManagerPlus>
            ),
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
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
