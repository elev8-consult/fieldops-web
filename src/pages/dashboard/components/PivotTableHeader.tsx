interface PivotTableHeaderProps {
  products: Array<{ id: string; canonical_name: string }>;
}

export function PivotTableHeader({ products }: PivotTableHeaderProps) {
  return (
    <thead>
      <tr>
        <th className="sticky left-0 top-0 z-40 min-w-56 border-b border-r border-slate-300 bg-slate-100 px-3 py-3 text-left text-sm font-semibold text-slate-900">
          Outlet
        </th>
        {products.map((product) => (
          <th
            key={product.id}
            className="sticky top-0 z-30 min-w-36 border-b border-r border-slate-200 bg-slate-100 px-2 py-3 text-center text-xs font-semibold text-slate-700"
          >
            {product.canonical_name}
          </th>
        ))}
      </tr>
    </thead>
  );
}
