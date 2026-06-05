import { useUpdateMerchandiserItem } from '@/hooks/useUpdateMerchandiserItem';
import { cn } from '@/lib/utils';
import type { MerchandiserDashboardCell } from '@/types';
import { differenceInDays, format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PivotTableCellProps {
  cell?: MerchandiserDashboardCell;
  canEdit: boolean;
}

// Background color matches PivotCell.tsx getCellColor logic
function getCellBg(cell: MerchandiserDashboardCell | undefined): string {
  if (!cell || cell.quantity === null || cell.quantity === 0) {
    return 'bg-red-50';
  }
  if (!cell.expiry_date && !cell.expiry_raw) {
    return 'bg-slate-100'; // has stock but no expiry recorded
  }
  if (cell.expiry_date) {
    const days = differenceInDays(new Date(cell.expiry_date), new Date());
    if (days < 0) return 'bg-red-100';
    if (days <= 30) return 'bg-yellow-50';
  }
  return '';
}

function getExpiryTextClass(expiryDate: string | null): string {
  if (!expiryDate) return 'text-slate-400';
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return 'text-red-600 font-semibold';
  if (days <= 30) return 'text-amber-600 font-semibold';
  return 'text-slate-400';
}

function formatExpiry(
  expiryDate: string | null,
  expiryRaw: string | null,
): string | null {
  if (expiryDate) {
    try {
      return format(new Date(expiryDate), 'dd MMM yy');
    } catch {
      // fall through to raw
    }
  }
  return expiryRaw ?? null;
}

export function PivotTableCell({ cell, canEdit }: PivotTableCellProps) {
  const mutation = useUpdateMerchandiserItem();
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [optimisticQuantity, setOptimisticQuantity] = useState<
    number | null | undefined
  >(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayQty = optimisticQuantity ?? cell?.quantity ?? null;

  useEffect(() => {
    setOptimisticQuantity(undefined);
  }, [cell?.quantity, cell?.item_id]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const startEdit = () => {
    if (!canEdit || !cell?.item_id || mutation.isPending) return;
    setInputVal(displayQty != null ? String(displayQty) : '');
    setEditing(true);
  };

  const commit = () => {
    const parsed = Number.parseInt(inputVal, 10);
    if (!cell?.item_id || Number.isNaN(parsed) || parsed < 0) {
      setEditing(false);
      return;
    }
    if (parsed === (cell.quantity ?? null)) {
      setEditing(false);
      return;
    }
    const previous = cell.quantity ?? null;
    setOptimisticQuantity(parsed);
    mutation.mutate(
      { itemId: cell.item_id, quantity: parsed },
      {
        onError: () => setOptimisticQuantity(previous),
        onSettled: () => setEditing(false),
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <td className="min-w-36 border-b border-r border-slate-100 p-0 align-middle">
        <input
          ref={inputRef}
          type="number"
          min={0}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="h-full w-full rounded-sm border-2 border-blue-400 px-2 py-1 text-center text-sm outline-none"
        />
      </td>
    );
  }

  const expiryLabel = formatExpiry(
    cell?.expiry_date ?? null,
    cell?.expiry_raw ?? null,
  );
  const hasStock = cell != null && cell.quantity != null && cell.quantity > 0;
  const expiryMissing = hasStock && !expiryLabel;
  const bgClass = getCellBg(cell);
  const expiryClass = getExpiryTextClass(cell?.expiry_date ?? null);

  return (
    <td
      onClick={startEdit}
      className={cn(
        'min-w-36 border-b border-r border-slate-100 px-2 py-1.5 text-center align-middle',
        bgClass,
        canEdit && cell?.item_id
          ? 'cursor-pointer hover:brightness-95 hover:ring-1 hover:ring-inset hover:ring-blue-300'
          : '',
        mutation.isPending ? 'opacity-60' : '',
      )}
    >
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-medium text-slate-900">
            {displayQty ?? ''}
          </span>
          {mutation.isPending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          )}
        </div>
        {expiryLabel ? (
          <span className={cn('text-xs leading-tight', expiryClass)}>
            {expiryLabel}
          </span>
        ) : expiryMissing ? (
          <span className="text-xs leading-tight text-slate-400">—</span>
        ) : null}
      </div>
    </td>
  );
}
