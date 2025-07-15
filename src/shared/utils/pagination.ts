import type { PaginatedResult } from '@shared/types/pagination';

export function getPaginatedResult<T extends { id: string }>(items: T[], limit: number): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const slicedItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? getCursorFromItem(slicedItems[slicedItems.length - 1]) : null;

  return {
    items: slicedItems,
    meta: {
      nextCursor,
      hasMore,
    },
  };
}

function getCursorFromItem<T extends { id: string }>(item: T): string {
  return item.id;
}
