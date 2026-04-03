import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, type TableColumn } from '@/components/ui/Table';
import { formatDate } from '@/lib/utils';
import type { MerchandiserItem } from '@/types';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { isPast, parseISO } from 'date-fns';

export interface MerchandiserItemsTableProps {
  items: MerchandiserItem[];
  reportId?: string;
  onSaveItem: (
    itemId: string,
    body: { productId?: number | null; quantity?: number | null; expiryDate?: string | null },
  ) => void;
  savingId?: string | null;
}

export function MerchandiserItemsTable({
  items,
  reportId: _reportId,
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
