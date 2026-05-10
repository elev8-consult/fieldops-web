import { useReviewFlaggedCount } from '@/hooks/useReview';
import { useUnknownSenderUnresolvedCount } from '@/hooks/useUnknownSenders';
import { ROLES } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPin,
  MessageSquare,
  Package,
  Tag,
  UserRoundX,
  UserCog,
  Users,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white',
  ].join(' ');

export function Sidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const hasRole = useAuthStore((s) => s.hasRole);

  const brandIdForCount =
    user?.role === ROLES.BRAND_MANAGER ? user.brandId ?? undefined : undefined;
  const showAdmin =
    hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.BRAND_MANAGER);
  const { data: flaggedCount = 0 } = useReviewFlaggedCount(brandIdForCount);
  const { data: unknownSendersCount = 0 } =
    useUnknownSenderUnresolvedCount(showAdmin);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900">
      <div className="px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-white/10 p-2">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">FieldOps</div>
            <div className="text-xs text-slate-400">Operations Platform</div>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-2">
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          Dashboard
        </NavLink>
        <p className="px-6 pt-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Dashboard
        </p>
        <NavLink to="/dashboard/merchandiser" className={navClass}>
          <LayoutGrid className="h-5 w-5 shrink-0" />
          Stock Dashboard
        </NavLink>
        <NavLink to="/dashboard/promoter" className={navClass}>
          <LayoutGrid className="h-5 w-5 shrink-0" />
          Promoter Dashboard
        </NavLink>
        <NavLink to="/review" className={navClass}>
          <ClipboardCheck className="h-5 w-5 shrink-0" />
          <span className="flex flex-1 items-center justify-between gap-2">
            Review Queue
            {flaggedCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                {flaggedCount > 99 ? '99+' : flaggedCount}
              </span>
            )}
          </span>
        </NavLink>
        <NavLink to="/messages" className={navClass}>
          <MessageSquare className="h-5 w-5 shrink-0" />
          Messages
        </NavLink>
        <NavLink to="/reports/merchandiser" className={navClass}>
          <Package className="h-5 w-5 shrink-0" />
          Merchandiser
        </NavLink>
        <NavLink to="/reports/promoter" className={navClass}>
          <Users className="h-5 w-5 shrink-0" />
          Promoter
        </NavLink>

        {showAdmin && (
          <>
            <div className="mx-6 my-3 border-t border-slate-700" />
            <p className="px-6 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Admin
            </p>
            <NavLink to="/admin/brands" className={navClass}>
              <Building2 className="h-5 w-5 shrink-0" />
              Brands
            </NavLink>
            {hasRole(ROLES.SUPER_ADMIN) && (
              <NavLink to="/admin/users" className={navClass}>
                <UserCog className="h-5 w-5 shrink-0" />
                Users
              </NavLink>
            )}
            <NavLink to="/admin/outlets" className={navClass}>
              <MapPin className="h-5 w-5 shrink-0" />
              Outlets
            </NavLink>
            <NavLink to="/admin/products" className={navClass}>
              <Tag className="h-5 w-5 shrink-0" />
              Products
            </NavLink>
            <NavLink to="/admin/unknown-senders" className={navClass}>
              <UserRoundX className="h-5 w-5 shrink-0" />
              <span className="flex flex-1 items-center justify-between gap-2">
                Unknown Senders
                {unknownSendersCount > 0 && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {unknownSendersCount > 99 ? '99+' : unknownSendersCount}
                  </span>
                )}
              </span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            {getInitials(user?.fullName ?? null)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">
              {user?.fullName}
            </div>
            <div className="truncate text-xs capitalize text-slate-400">
              {user?.role?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            clearAuth();
            navigate('/login', { replace: true });
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
