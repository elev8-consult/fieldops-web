import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/review': 'Review Queue',
  '/messages': 'Message Log',
  '/reports/merchandiser': 'Merchandiser Reports',
  '/reports/promoter': 'Promoter Reports',
  '/admin/brands': 'Brands',
  '/admin/users': 'Users',
  '/admin/outlets': 'Outlets',
  '/admin/products': 'Products',
};

export function TopBar() {
  const location = useLocation();
  const { user } = useAuth();

  const title = useMemo(() => {
    const path = location.pathname;
    if (titles[path]) return titles[path];
    if (path.startsWith('/review/')) return 'Review Report';
    if (path.startsWith('/reports/merchandiser/')) return 'Merchandiser Report';
    if (path.startsWith('/reports/promoter/')) return 'Promoter Report';
    return 'FieldOps';
  }, [location.pathname]);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white"
          title={user?.fullName ?? ''}
        >
          {getInitials(user?.fullName ?? null)}
        </div>
      </div>
    </header>
  );
}
