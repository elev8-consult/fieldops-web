import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import api from '@/api/axios';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/lib/constants';
import { getAxiosMessage } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { AlertTriangle, Images } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ShelfVisit {
  outletId: string;
  outletName: string;
  regionName: string | null;
  brandId: string;
  brandName: string;
  visitDate: string;
  merchandiserName: string;
  beforeUrl: string | null;
  afterUrl: string | null;
}

interface ShelfPhotoResponse {
  storageReady: boolean;
  outlets: Array<{ id: string; name: string }>;
  visits: ShelfVisit[];
}

function defaultRange() {
  return {
    dateFrom: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
  };
}

async function fetchShelfPhotos(params: {
  dateFrom: string;
  dateTo: string;
  outletId?: string;
}): Promise<ShelfPhotoResponse> {
  const { data } = await api.get<ShelfPhotoResponse>('/shelf-photos', {
    params: {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      outletId: params.outletId || undefined,
    },
  });
  return data;
}

function formatVisitDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function ShelfPictures() {
  const { user } = useAuth();
  const isBrandManager = user?.role === ROLES.BRAND_MANAGER;
  const initial = useMemo(() => defaultRange(), []);
  const [dateFrom, setDateFrom] = useState(initial.dateFrom);
  const [dateTo, setDateTo] = useState(initial.dateTo);
  const [applied, setApplied] = useState(initial);
  const [outletId, setOutletId] = useState('');
  const [zoom, setZoom] = useState<{ src: string; label: string } | null>(null);

  const photosQ = useQuery({
    queryKey: ['shelf-photos', applied.dateFrom, applied.dateTo, outletId],
    queryFn: () =>
      fetchShelfPhotos({
        dateFrom: applied.dateFrom,
        dateTo: applied.dateTo,
        outletId: outletId || undefined,
      }),
    enabled: Boolean(applied.dateFrom && applied.dateTo),
  });

  const outlets = photosQ.data?.outlets ?? [];
  const visits = photosQ.data?.visits ?? [];
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; region: string | null; visits: ShelfVisit[] }>();
    for (const visit of visits) {
      const group = map.get(visit.outletId) ?? {
        name: visit.outletName,
        region: visit.regionName,
        visits: [],
      };
      group.visits.push(visit);
      map.set(visit.outletId, group);
    }
    return [...map.entries()];
  }, [visits]);

  function applyDates() {
    if (!dateFrom || !dateTo || dateFrom > dateTo) return;
    setApplied({ dateFrom, dateTo });
    setOutletId('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shelf pictures</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isBrandManager
            ? 'Before and after pictures for your brand. Only supermarkets that have both pictures are listed.'
            : 'Before and after pictures for every brand. Only supermarkets that have both pictures are listed.'}
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Date from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Date to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <div className="flex items-end">
            <Button className="w-full" onClick={applyDates} disabled={dateFrom > dateTo}>
              Apply dates
            </Button>
          </div>
          <Select
            label="Supermarket"
            value={outletId}
            onValueChange={setOutletId}
            disabled={outlets.length === 0}
          >
            <option value="">All supermarkets</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {photosQ.data && !photosQ.data.storageReady && visits.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Pictures are saved, but the bucket is not connected to the API, so they cannot be shown yet.
        </div>
      )}

      {photosQ.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : photosQ.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
          <h2 className="font-semibold text-red-900">Could not load shelf pictures</h2>
          <p className="mt-1 text-sm text-red-700">{getAxiosMessage(photosQ.error)}</p>
          <Button className="mt-4" onClick={() => photosQ.refetch()}>
            Retry
          </Button>
        </div>
      ) : visits.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Images className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">
            No before and after pictures in this date range
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A supermarket appears here after a merchandiser has saved both pictures for a brand.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([id, group]) => (
            <section key={id} className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{group.name}</h2>
                {group.region && (
                  <p className="text-sm text-slate-500">{group.region}</p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {group.visits.map((visit) => (
                  <article
                    key={`${visit.outletId}-${visit.brandId}-${visit.visitDate}-${visit.merchandiserName}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{visit.brandName}</p>
                        <p className="text-sm text-slate-500">
                          {formatVisitDate(visit.visitDate)} · {visit.merchandiserName}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-px bg-slate-100">
                      <PhotoSlot
                        label="Before"
                        url={visit.beforeUrl}
                        onOpen={() =>
                          visit.beforeUrl &&
                          setZoom({
                            src: visit.beforeUrl,
                            label: `${visit.outletName} · ${visit.brandName} · Before`,
                          })
                        }
                      />
                      <PhotoSlot
                        label="After"
                        url={visit.afterUrl}
                        onOpen={() =>
                          visit.afterUrl &&
                          setZoom({
                            src: visit.afterUrl,
                            label: `${visit.outletName} · ${visit.brandName} · After`,
                          })
                        }
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {zoom && (
        <button
          type="button"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-6"
          onClick={() => setZoom(null)}
        >
          <img
            src={zoom.src}
            alt={zoom.label}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </button>
      )}
    </div>
  );
}

function PhotoSlot({
  label,
  url,
  onOpen,
}: {
  label: string;
  url: string | null;
  onOpen: () => void;
}) {
  return (
    <div className="bg-white p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {url ? (
        <button type="button" onClick={onOpen} className="block w-full">
          <img
            src={url}
            alt={label}
            className="h-52 w-full rounded-lg object-cover"
          />
        </button>
      ) : (
        <div className="flex h-52 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
          Picture unavailable
        </div>
      )}
    </div>
  );
}
