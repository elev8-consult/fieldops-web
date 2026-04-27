import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, type TableColumn } from '@/components/ui/Table';
import { useAcceptProductMatch } from '@/hooks/useReview';
import { formatDate } from '@/lib/utils';
import type { MerchandiserItem } from '@/types';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isPast, parseISO } from 'date-fns';

export interface MerchandiserItemsTableProps {
  items: MerchandiserItem[];
  reportId?: string;
  onRefresh?: () => void;
  onSaveItem: (
    itemId: string,
    body: { productId?: number | null; quantity?: number | null; expiryDate?: string | null },
  ) => void;
  savingId?: string | null;
}

interface MatchSuggestionProps {
  itemId: string;
  rawName: string;
  suggestions: Array<{ productId: string; canonicalName: string; confidence: number }>;
  onAccepted: () => void;
}

function MatchSuggestion({
  itemId,
  rawName,
  suggestions,
  onAccepted,
}: MatchSuggestionProps) {
  const [accepted, setAccepted] = useState(false);
  const acceptMatch = useAcceptProductMatch();

  if (accepted) {
    return (
      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Matched
      </span>
    );
  }

  if (suggestions.length === 0) {
    return <span className="text-xs text-slate-400 italic">No suggestions</span>;
  }

  const top = suggestions[0];

  const handleAccept = async () => {
    try {
      await acceptMatch.mutateAsync({
        itemId,
        productId: top.productId,
        rawName,
        reportType: 'merchandiser',
      });
      setAccepted(true);
      onAccepted();
    } catch (err) {
      console.error('Failed to accept match', err);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className="text-xs text-slate-600 max-w-[140px] truncate"
          title={top.canonicalName}
        >
          {top.canonicalName}
        </span>
        <span
          className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
            top.confidence >= 0.55
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-600'
          }`}
        >
          {Math.round(top.confidence * 100)}%
        </span>
      </div>
      <button
        onClick={handleAccept}
        disabled={acceptMatch.isPending}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium text-left disabled:opacity-50 flex items-center gap-1"
      >
        {acceptMatch.isPending ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <CheckCircle2 className="w-3 h-3" />
        )}
        Accept & save alias
      </button>
    </div>
  );
}

export function MerchandiserItemsTable({
  items,
  reportId: _reportId,
  onRefresh,
  onSaveItem,
  savingId,
}: MerchandiserItemsTableProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draftQty, setDraftQty] = useState('');
  const [draftExpiry, setDraftExpiry] = useState('');

  const columns: TableColumn<MerchandiserItem>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product (raw)',
        sortable: true,
        render: (row) => (
          <span className="font-medium">{row.productNameRaw ?? '—'}</span>
        ),
      },
      {
        key: 'quantity',
        header: 'Qty',
        sortable: true,
        render: (row) =>
          editId === row.id ? (
            <Input
              value={draftQty}
              onChange={(e) => setDraftQty(e.target.value)}
              className="max-w-[80px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            row.quantity ?? '—'
          ),
      },
      {
        key: 'expiryDate',
        header: 'Expiry',
        sortable: true,
        render: (row) => {
          const expired =
            row.expiryDate &&
            (() => {
              try {
                return isPast(parseISO(row.expiryDate));
              } catch {
                return false;
              }
            })();
          return editId === row.id ? (
            <Input
              type="date"
              value={draftExpiry}
              onChange={(e) => setDraftExpiry(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={expired ? 'font-medium text-red-600' : ''}>
              {formatDate(row.expiryDate)}
            </span>
          );
        },
      },
      {
        key: 'expiryRaw',
        header: 'Expiry raw',
        render: (row) => row.expiryRaw ?? '—',
      },
      {
        key: 'matched',
        header: 'Matched',
        render: (row) =>
          row.isProductMatched ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          ),
      },
      {
        key: 'closestMatch',
        header: 'Closest Match',
        render: (row) =>
          row.isProductMatched ? (
            <span className="flex items-center gap-1 text-emerald-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              {row.product?.canonicalName ?? row.productNameRaw}
            </span>
          ) : (
            <MatchSuggestion
              itemId={row.id}
              rawName={row.productNameRaw ?? ''}
              suggestions={row.matchSuggestions ?? []}
              onAccepted={() => onRefresh?.()}
            />
          ),
      },
      {
        key: 'actions',
        header: '',
        render: (row) =>
          editId === row.id ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                onClick={() => {
                  onSaveItem(row.id, {
                    quantity: draftQty === '' ? null : Number(draftQty),
                    expiryDate: draftExpiry || null,
                  });
                  setEditId(null);
                }}
                loading={savingId === row.id}
              >
                ✓
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditId(null)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="!p-2"
              onClick={(e) => {
                e.stopPropagation();
                setEditId(row.id);
                setDraftQty(row.quantity != null ? String(row.quantity) : '');
                setDraftExpiry(
                  row.expiryDate ? row.expiryDate.slice(0, 10) : '',
                );
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ),
      },
    ],
    [editId, draftQty, draftExpiry, onSaveItem, savingId],
  );

  const [sortKey, setSortKey] = useState('product');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'product') {
        av = a.productNameRaw ?? '';
        bv = b.productNameRaw ?? '';
      } else if (sortKey === 'quantity') {
        av = a.quantity ?? -1;
        bv = b.quantity ?? -1;
      } else if (sortKey === 'expiryDate') {
        av = a.expiryDate ?? '';
        bv = b.expiryDate ?? '';
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [items, sortKey, sortDir]);

  return (
    <Table
      columns={columns}
      data={sorted}
      rowKey={(r) => r.id}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={(key) => {
        if (sortKey === key) {
          setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
          setSortKey(key);
          setSortDir('asc');
        }
      }}
    />
  );
}
