import { cn } from '@/lib/utils';

type Variant = 'text' | 'card' | 'table-row' | 'circle';

export interface SkeletonProps {
  variant?: Variant;
  className?: string;
}

export function Skeleton({ variant = 'text', className }: SkeletonProps) {
  const base = 'animate-pulse rounded-md bg-slate-200';
  if (variant === 'circle') {
    return <div className={cn(base, 'h-10 w-10 rounded-full', className)} />;
  }
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-xl border border-slate-100 bg-white p-6 shadow-sm',
          className,
        )}
      >
        <div className={cn(base, 'mb-4 h-6 w-1/3')} />
        <div className={cn(base, 'mb-2 h-4 w-full')} />
        <div className={cn(base, 'h-4 w-2/3')} />
      </div>
    );
  }
  if (variant === 'table-row') {
    return (
      <div className={cn('flex gap-4 border-b border-slate-100 py-3', className)}>
        <div className={cn(base, 'h-4 flex-1')} />
        <div className={cn(base, 'h-4 flex-1')} />
        <div className={cn(base, 'h-4 w-24')} />
      </div>
    );
  }
  return <div className={cn(base, 'h-4 w-full', className)} />;
}
