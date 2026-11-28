import { Book } from '../data/books';

export type SortMode = 'default' | 'price-asc' | 'price-desc';

export interface Filters {
  query: string;
  category: string;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortMode;
}

export function filterBooks(books: readonly Book[], filters: Filters): Book[] {
  const result = books.filter((book) => {
    if (filters.query && !book.title.toLowerCase().includes(filters.query)) return false;
    if (filters.category && book.category !== filters.category) return false;
    if (filters.minPrice !== null && book.price < filters.minPrice) return false;
    if (filters.maxPrice !== null && book.price > filters.maxPrice) return false;
    return true;
  });

  if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);

  return result;
}
