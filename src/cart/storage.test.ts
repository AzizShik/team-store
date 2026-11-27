import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Book } from '../data/books';
import { CART_STORAGE_KEY, loadCart, parseCart, saveCart } from './storage';

const book = (id: string, price: number): Book => ({
  id,
  title: `Книга ${id}`,
  author: 'Автор',
  category: 'fiction',
  price,
});

const BOOKS: Book[] = [book('a', 1190), book('b', 990), book('c', 690)];

const EMPTY = { items: [], promo: null };

describe('parseCart', () => {
  it('корректные данные читаются как есть', () => {
    const raw = JSON.stringify({
      items: [
        { id: 'a', qty: 1 },
        { id: 'b', qty: 2 },
      ],
      promo: 'SALE10',
    });

    expect(parseCart(raw, BOOKS)).toEqual({
      items: [
        { id: 'a', qty: 1 },
        { id: 'b', qty: 2 },
      ],
      promo: 'SALE10',
    });
  });

  it('null (ключа нет) даёт пустую корзину', () => {
    expect(parseCart(null, BOOKS)).toEqual(EMPTY);
  });

  it('битый JSON даёт пустую корзину', () => {
    expect(parseCart('{items: [', BOOKS)).toEqual(EMPTY);
  });

  it('JSON не того вида даёт пустую корзину', () => {
    expect(parseCart('42', BOOKS)).toEqual(EMPTY);
    expect(parseCart('null', BOOKS)).toEqual(EMPTY);
    expect(parseCart('[]', BOOKS)).toEqual(EMPTY);
    expect(parseCart('"text"', BOOKS)).toEqual(EMPTY);
  });

  it('если items не массив, корзина пустая и промокод сбрасывается', () => {
    const raw = JSON.stringify({ items: 'oops', promo: 'SALE10' });
    expect(parseCart(raw, BOOKS)).toEqual(EMPTY);
  });

  it('промокод сбрасывается, если после проверки не осталось товаров', () => {
    const raw = JSON.stringify({ items: [{ id: 'unknown', qty: 1 }], promo: 'SALE10' });
    expect(parseCart(raw, BOOKS)).toEqual(EMPTY);
  });

  it('отбрасывает неизвестные id', () => {
    const raw = JSON.stringify({
      items: [
        { id: 'a', qty: 1 },
        { id: 'unknown', qty: 3 },
      ],
      promo: null,
    });

    expect(parseCart(raw, BOOKS).items).toEqual([{ id: 'a', qty: 1 }]);
  });

  it('отбрасывает некорректное количество', () => {
    const raw = JSON.stringify({
      items: [
        { id: 'a', qty: 0 },
        { id: 'a', qty: -2 },
        { id: 'a', qty: 1.5 },
        { id: 'a', qty: '2' },
        { id: 'a', qty: null },
        { id: 'a' },
        { id: 'b', qty: 2 },
      ],
      promo: null,
    });

    expect(parseCart(raw, BOOKS).items).toEqual([{ id: 'b', qty: 2 }]);
  });

  it('отбрасывает элементы не того вида', () => {
    const raw = JSON.stringify({
      items: [null, 'a', 42, { id: 1, qty: 1 }, { qty: 1 }, { id: 'c', qty: 1 }],
      promo: null,
    });

    expect(parseCart(raw, BOOKS).items).toEqual([{ id: 'c', qty: 1 }]);
  });

  it('складывает количества повторяющихся id, порядок по первому вхождению', () => {
    const raw = JSON.stringify({
      items: [
        { id: 'a', qty: 2 },
        { id: 'b', qty: 1 },
        { id: 'a', qty: 3 },
      ],
      promo: null,
    });

    expect(parseCart(raw, BOOKS).items).toEqual([
      { id: 'a', qty: 5 },
      { id: 'b', qty: 1 },
    ]);
  });

  it('неизвестный или не строковый промокод превращается в null', () => {
    const items = [{ id: 'a', qty: 1 }];

    expect(parseCart(JSON.stringify({ items, promo: 'WRONG' }), BOOKS).promo).toBeNull();
    expect(parseCart(JSON.stringify({ items, promo: 10 }), BOOKS).promo).toBeNull();
    expect(parseCart(JSON.stringify({ items }), BOOKS).promo).toBeNull();
  });
});

describe('loadCart / saveCart', () => {
  const createMemoryStorage = () => {
    const data = new Map<string, string>();
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('сохранённая корзина загружается обратно', () => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    const state = { items: [{ id: 'a', qty: 2 }], promo: 'SALE10' };

    saveCart(state);

    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '')).toEqual(state);
    expect(loadCart(BOOKS)).toEqual(state);
  });

  it('не падает, если localStorage недоступен', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('quota');
      },
    });

    expect(() => saveCart({ items: [{ id: 'a', qty: 1 }], promo: null })).not.toThrow();
    expect(loadCart(BOOKS)).toEqual(EMPTY);
  });
});
