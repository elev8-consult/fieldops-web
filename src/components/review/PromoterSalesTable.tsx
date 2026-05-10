import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, type TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import type { PromoterSaleItem } from '@/types';
import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface PromoterSalesTableProps {
  items: PromoterSaleItem[];
  reportId: string;
  onSaveItem: (
    itemId: string,
    body: {
      productId?: string | null;
      quantity?: number | null;
      promoLabel?: string | null;
      isOffer?: boolean;
    },
  ) => void;
  savingId?: string | null;
}

export function PromoterSalesTable({
  items,
  reportId: _reportId,
  onSaveItem,
  savingId,
}: PromoterSalesTableProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const [label, setLabel] = useState('');

  const columns: TableColumn<PromoterSaleItem>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Product',
        sortable: true,
        render: (row) => row.productNameRaw ?? '—',
      },
      {
        key: 'quantity',
        header: 'Qty',
        sortable: true,
        render: (row) =>
          editId === row.id ? (
            <Input
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="max-w-[80px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            row.quantity ?? '—'
          ),
      },
      {
        key: 'promoLabel',
        header: 'Promo label',
        render: (row) =>
          editId === row.id ? (
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            row.promoLabel ?? '—'
          ),
      },
      {
        key: 'isOffer',
        header: 'Offer',
        render: (row) =>
          row.isOffer ? (
            <Badge status="approved">Yes</Badge>
          ) : (
            <span className="text-slate-400">No</span>
          ),
      },
      {
        key: 'matched',
        header: 'Matched',
        render: (row) => (row.isProductMatched ? 'Yes' : 'No'),
      },
      {
        key: 'matchType',
        header: 'Match',
        render: (row) => row.matchType ?? 'unmatched',
      },
      {
        key: 'matchConfidence',
        header: 'Confidence',
        render: (row) =>
          row.matchConfidence != null
            ? `${Math.round(Number(row.matchConfidence) * 100)}%`
            : '—',
      },
      {
        key: 'act',
        header: '',
        render: (row) =>
          editId === row.id ? (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                loading={savingId === row.id}
                onClick={() => {
                  onSaveItem(row.id, {
                    quantity: qty === '' ? null : Number(qty),
                    promoLabel: label || null,
                  });
                  setEditId(null);
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="!p-2"
              onClick={(e) => {
                e.stopPropagation();
                setEditId(row.id);
                setQty(row.quantity != null ? String(row.quantity) : '');
                setLabel(row.promoLabel ?? '');
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ),
      },
    ],
    [editId, qty, label, onSaveItem, savingId],
  );

  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const sorted = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortKey === 'name') {
        av = a.productNameRaw ?? '';
        bv = b.productNameRaw ?? '';
      } else if (sortKey === 'quantity') {
        av = a.quantity ?? -1;
        bv = b.quantity ?? -1;
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
      onSort={(k) => {
        if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else {
          setSortKey(k);
          setSortDir('asc');
        }
      }}
    />
  );
}
