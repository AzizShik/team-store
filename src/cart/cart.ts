import type { Book } from '../data/books';

export interface CartItem {
  id: string;
  qty: number;
}

export interface CartLine {
  book: Book;
  qty: number;
  lineTotal: number;
}

export interface CartSummary {
  lines: CartLine[];
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  promo: string | null;
}

const PROMO_CODES = new Map<string, number>([['SALE10', 10]]);

export const normalizePromo = (code: string): string => code.trim().toUpperCase();

export function getPromoPercent(code: string | null): number {
  if (!code) return 0;
  return PROMO_CODES.get(normalizePromo(code)) ?? 0;
}

export function addItem(items: readonly CartItem[], id: string): CartItem[] {
  if (!items.some((item) => item.id === id)) return [...items, { id, qty: 1 }];
  return items.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item));
}

export function changeQty(items: readonly CartItem[], id: string, delta: number): CartItem[] {
  return items
    .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
    .filter((item) => item.qty > 0);
}

export function removeItem(items: readonly CartItem[], id: string): CartItem[] {
  return items.filter((item) => item.id !== id);
}

export function getItemsCount(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export function calcCart(
  items: readonly CartItem[],
  books: readonly Book[],
  promo: string | null,
): CartSummary {
  const lines: CartLine[] = [];

  for (const item of items) {
    const book = books.find((candidate) => candidate.id === item.id);
    if (!book) continue;
    lines.push({ book, qty: item.qty, lineTotal: book.price * item.qty });
  }

  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const percent = getPromoPercent(promo);
  const discount = Math.round((subtotal * percent) / 100);

  return {
    lines,
    count,
    subtotal,
    discount,
    total: subtotal - discount,
    promo: percent > 0 && promo ? normalizePromo(promo) : null,
  };
}
