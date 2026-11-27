import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '../data/books';
import { CART_STORAGE_KEY } from './storage';
import { createCartStore } from './store';

const book = (id: string, price: number): Book => ({
  id,
  title: `Книга ${id}`,
  author: 'Автор',
  category: 'fiction',
  price,
});

const BOOKS: Book[] = [book('a', 1190), book('b', 990), book('c', 690)];

const createMemoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

const readSaved = () => JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null');

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createCartStore', () => {
  it('без сохранённых данных корзина пустая', () => {
    const store = createCartStore(BOOKS);
    expect(store.getCart()).toEqual({ items: [], promo: null });
  });

  it('при создании загружает сохранённую корзину', () => {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: [{ id: 'b', qty: 2 }], promo: 'SALE10' }),
    );

    const store = createCartStore(BOOKS);

    expect(store.getCart()).toEqual({ items: [{ id: 'b', qty: 2 }], promo: 'SALE10' });
  });
});

describe('действия с товарами', () => {
  it('addToCart добавляет книгу и сохраняет корзину', () => {
    const store = createCartStore(BOOKS);

    store.addToCart('a');
    store.addToCart('a');

    expect(store.getCart().items).toEqual([{ id: 'a', qty: 2 }]);
    expect(readSaved()).toEqual({ items: [{ id: 'a', qty: 2 }], promo: null });
  });

  it('addToCart игнорирует неизвестный id', () => {
    const store = createCartStore(BOOKS);

    store.addToCart('unknown');

    expect(store.getCart().items).toEqual([]);
  });

  it('changeCartQty меняет количество и сохраняет', () => {
    const store = createCartStore(BOOKS);
    store.addToCart('a');

    store.changeCartQty('a', 2);

    expect(store.getCart().items).toEqual([{ id: 'a', qty: 3 }]);
    expect(readSaved().items).toEqual([{ id: 'a', qty: 3 }]);
  });

  it('changeCartQty до 0 удаляет книгу', () => {
    const store = createCartStore(BOOKS);
    store.addToCart('a');
    store.addToCart('b');

    store.changeCartQty('a', -1);

    expect(store.getCart().items).toEqual([{ id: 'b', qty: 1 }]);
  });

  it('removeFromCart удаляет книгу и сохраняет', () => {
    const store = createCartStore(BOOKS);
    store.addToCart('a');
    store.addToCart('b');

    store.removeFromCart('a');

    expect(store.getCart().items).toEqual([{ id: 'b', qty: 1 }]);
    expect(readSaved().items).toEqual([{ id: 'b', qty: 1 }]);
  });
});

describe('applyPromo', () => {
  it('известный код применяется, сохраняется и возвращает applied', () => {
    const store = createCartStore(BOOKS);
    store.addToCart('a');

    expect(store.applyPromo('SALE10')).toBe('applied');
    expect(store.getCart().promo).toBe('SALE10');
    expect(readSaved().promo).toBe('SALE10');
  });

  it('неизвестный код возвращает unknown и не меняет текущий промокод', () => {
    const store = createCartStore(BOOKS);
    store.addToCart('a');
    store.applyPromo('SALE10');

    expect(store.applyPromo('WRONG')).toBe('unknown');
    expect(store.getCart().promo).toBe('SALE10');
  });

  it('при пустой корзине возвращает empty и не применяется', () => {
    const store = createCartStore(BOOKS);

    expect(store.applyPromo('SALE10')).toBe('empty');
    expect(store.getCart().promo).toBeNull();
  });

  it('сбрасывается, когда из корзины удалили последнюю книгу', () => {
    const store = createCartStore(BOOKS);
    store.addToCart('a');
    store.applyPromo('SALE10');

    store.removeFromCart('a');

    expect(store.getCart()).toEqual({ items: [], promo: null });
    expect(readSaved()).toEqual({ items: [], promo: null });
  });
});

describe('subscribe', () => {
  it('оповещает подписчика новым состоянием после каждого действия', () => {
    const store = createCartStore(BOOKS);
    const listener = vi.fn();
    store.subscribe(listener);

    store.addToCart('a');
    store.changeCartQty('a', 1);
    store.applyPromo('SALE10');
    store.removeFromCart('a');

    expect(listener).toHaveBeenCalledTimes(4);
    expect(listener).toHaveBeenNthCalledWith(1, { items: [{ id: 'a', qty: 1 }], promo: null });
    expect(listener).toHaveBeenLastCalledWith({ items: [], promo: null });
  });

  it('не оповещает, если состояние не изменилось', () => {
    const store = createCartStore(BOOKS);
    const listener = vi.fn();
    store.subscribe(listener);

    store.addToCart('unknown');
    store.applyPromo('SALE10');

    expect(listener).not.toHaveBeenCalled();
  });

  it('после отписки больше не оповещает', () => {
    const store = createCartStore(BOOKS);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.addToCart('a');

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('syncFromStorage', () => {
  it('перечитывает localStorage (изменение из другой вкладки) и оповещает', () => {
    const store = createCartStore(BOOKS);
    const listener = vi.fn();
    store.subscribe(listener);

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items: [{ id: 'c', qty: 4 }] }));
    store.syncFromStorage();

    expect(store.getCart()).toEqual({ items: [{ id: 'c', qty: 4 }], promo: null });
    expect(listener).toHaveBeenCalledWith({ items: [{ id: 'c', qty: 4 }], promo: null });
  });
});
