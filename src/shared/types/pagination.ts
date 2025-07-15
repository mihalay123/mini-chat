export type PaginatedResult<T> = {
  items: T[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};
