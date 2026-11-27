import { BOOKS, type Book } from '../data/books';
import { addItem, changeQty, getPromoPercent, normalizePromo, removeItem } from './cart';
import { CART_STORAGE_KEY, loadCart, saveCart, type CartState } from './storage';

export type PromoResult = 'applied' | 'unknown' | 'empty';
export type CartListener = (state: CartState) => void;

export interface CartStore {
  getCart(): CartState;
  subscribe(listener: CartListener): () => void;
  addToCart(id: string): void;
  changeCartQty(id: string, delta: number): void;
  removeFromCart(id: string): void;
  applyPromo(code: string): PromoResult;
  syncFromStorage(): void;
}

export function createCartStore(books: readonly Book[] = BOOKS): CartStore {
  let state = loadCart(books);
  const listeners = new Set<CartListener>();

  const notify = () => {
    listeners.forEach((listener) => listener(state));
  };

  const commit = (next: CartState) => {
    // Пустая корзина всегда без промокода
    state = next.items.length > 0 ? next : { items: [], promo: null };
    saveCart(state);
    notify();
  };

  return {
    getCart: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    addToCart(id) {
      if (!books.some((book) => book.id === id)) return;
      commit({ ...state, items: addItem(state.items, id) });
    },

    changeCartQty(id, delta) {
      commit({ ...state, items: changeQty(state.items, id, delta) });
    },

    removeFromCart(id) {
      commit({ ...state, items: removeItem(state.items, id) });
    },

    applyPromo(code) {
      if (state.items.length === 0) return 'empty';
      if (getPromoPercent(code) === 0) return 'unknown';
      commit({ ...state, promo: normalizePromo(code) });
      return 'applied';
    },

    syncFromStorage() {
      state = loadCart(books);
      notify();
    },
  };
}

// Общий экземпляр для страниц: создаётся при первом обращении
let defaultStore: CartStore | null = null;

function getStore(): CartStore {
  if (defaultStore) return defaultStore;

  const store = createCartStore();
  defaultStore = store;

  // Синхронизация между вкладками: событие storage приходит только в другие вкладки
  window.addEventListener('storage', (event) => {
    if (event.key === CART_STORAGE_KEY || event.key === null) store.syncFromStorage();
  });

  return store;
}

export const getCart = (): CartState => getStore().getCart();
export const subscribe = (listener: CartListener): (() => void) => getStore().subscribe(listener);
export const addToCart = (id: string): void => getStore().addToCart(id);
export const changeCartQty = (id: string, delta: number): void =>
  getStore().changeCartQty(id, delta);
export const removeFromCart = (id: string): void => getStore().removeFromCart(id);
export const applyPromo = (code: string): PromoResult => getStore().applyPromo(code);
