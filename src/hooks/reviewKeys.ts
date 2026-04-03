import type { ReviewQueueParams } from '@/api/review';

export const reviewKeys = {
  all: ['review'] as const,
  queue: (p: ReviewQueueParams) => ['review', 'queue', p] as const,
  detail: (id: string) => ['review', 'detail', id] as const,
};
