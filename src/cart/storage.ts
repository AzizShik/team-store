import { BOOKS, type Book } from '../data/books';
import { getPromoPercent, normalizePromo, type CartItem } from './cart';

export interface CartState {
  items: CartItem[];
  promo: string | null;
}

export const CART_STORAGE_KEY = 'pereplet:cart';

const emptyCart = (): CartState => ({ items: [], promo: null });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isValidQty = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1;

function parseItems(value: unknown, books: readonly Book[]): CartItem[] {
  if (!Array.isArray(value)) return [];

  const knownIds = new Set(books.map((book) => book.id));
  const qtyById = new Map<string, number>();

  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const { id, qty } = entry;
    if (typeof id !== 'string' || !knownIds.has(id) || !isValidQty(qty)) continue;
    qtyById.set(id, (qtyById.get(id) ?? 0) + qty);
  }

  return [...qtyById].map(([id, qty]) => ({ id, qty }));
}

function parsePromo(value: unknown): string | null {
  if (typeof value !== 'string' || getPromoPercent(value) === 0) return null;
  return normalizePromo(value);
}

export function parseCart(raw: string | null, books: readonly Book[]): CartState {
  if (raw === null) return emptyCart();

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyCart();
  }

  if (!isRecord(data)) return emptyCart();

  const items = parseItems(data.items, books);
  // Пустая корзина всегда без промокода
  return { items, promo: items.length > 0 ? parsePromo(data.promo) : null };
}

export function loadCart(books: readonly Book[] = BOOKS): CartState {
  try {
    return parseCart(localStorage.getItem(CART_STORAGE_KEY), books);
  } catch {
    return emptyCart();
  }
}

export function saveCart(state: CartState): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage недоступен или переполнен — корзина живёт только в памяти
  }
}
