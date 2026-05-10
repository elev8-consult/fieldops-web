import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, type TableColumn } from '@/components/ui/Table';
import type { PromoterSampleItem } from '@/types';
import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface PromoterSamplesTableProps {
  items: PromoterSampleItem[];
  reportId: string;
  onSaveItem: (
    itemId: string,
    body: {
      productId?: string | null;
      quantity?: number | null;
      availabilityNote?: string | null;
    },
  ) => void;
  savingId?: string | null;
}

export function PromoterSamplesTable({
  items,
  reportId: _reportId,
  onSaveItem,
  savingId,
}: PromoterSamplesTableProps) {
  const [editId, setEditId] = useState<string | null>(null);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');

  const columns: TableColumn<PromoterSampleItem>[] = useMemo(
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
        key: 'note',
        header: 'Availability',
        render: (row) =>
          editId === row.id ? (
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            row.availabilityNote ?? '—'
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
                    availabilityNote: note || null,
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
                setNote(row.availabilityNote ?? '');
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          ),
      },
    ],
    [editId, qty, note, onSaveItem, savingId],
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
