import { useUpdateMerchandiserItem } from '@/hooks/useUpdateMerchandiserItem';
import type { MerchandiserDashboardCell } from '@/types';
import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PivotTableCellProps {
  cell?: MerchandiserDashboardCell;
  canEdit: boolean;
}

export function PivotTableCell({ cell, canEdit }: PivotTableCellProps) {
  const mutation = useUpdateMerchandiserItem();
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [optimisticQuantity, setOptimisticQuantity] = useState<number | null | undefined>(
    undefined,
  );
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
      <td className="min-w-36 border-b border-r border-slate-100 p-0 align-top">
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

  return (
    <td
      onClick={startEdit}
      className={`min-w-36 border-b border-r border-slate-100 px-2 py-1 text-center text-sm align-top ${
        canEdit && cell?.item_id
          ? 'cursor-pointer hover:bg-blue-50 hover:ring-1 hover:ring-blue-300'
          : ''
      } ${mutation.isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{displayQty ?? ''}</span>
        {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
      </div>
    </td>
  );
}
