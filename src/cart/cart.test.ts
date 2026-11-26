import { describe, expect, it } from 'vitest';
import type { Book } from '../data/books';
import { addItem, calcCart, changeQty, getItemsCount, removeItem, type CartItem } from './cart';

const book = (id: string, price: number): Book => ({
  id,
  title: `Книга ${id}`,
  author: 'Автор',
  category: 'fiction',
  price,
});

const BOOKS: Book[] = [book('a', 1190), book('b', 990), book('c', 690)];

describe('addItem', () => {
  it('добавляет новую книгу с количеством 1', () => {
    expect(addItem([], 'a')).toEqual([{ id: 'a', qty: 1 }]);
  });

  it('увеличивает количество, если книга уже в корзине, без новой строки', () => {
    const items: CartItem[] = [{ id: 'a', qty: 1 }];
    expect(addItem(items, 'a')).toEqual([{ id: 'a', qty: 2 }]);
  });

  it('не изменяет исходный массив', () => {
    const items: CartItem[] = [{ id: 'a', qty: 1 }];
    addItem(items, 'a');
    expect(items).toEqual([{ id: 'a', qty: 1 }]);
  });
});

describe('changeQty', () => {
  it('увеличивает и уменьшает количество', () => {
    const items: CartItem[] = [{ id: 'a', qty: 2 }];
    expect(changeQty(items, 'a', 1)).toEqual([{ id: 'a', qty: 3 }]);
    expect(changeQty(items, 'a', -1)).toEqual([{ id: 'a', qty: 1 }]);
  });
});

describe('removeItem', () => {
  it('удаляет книгу из корзины', () => {
    const items: CartItem[] = [
      { id: 'a', qty: 1 },
      { id: 'b', qty: 2 },
    ];
    expect(removeItem(items, 'a')).toEqual([{ id: 'b', qty: 2 }]);
  });
});

describe('getItemsCount', () => {
  it('считает сумму количеств, а не число строк', () => {
    const items: CartItem[] = [
      { id: 'a', qty: 1 },
      { id: 'b', qty: 2 },
      { id: 'c', qty: 1 },
    ];
    expect(getItemsCount(items)).toBe(4);
  });
});

describe('calcCart', () => {
  const items: CartItem[] = [
    { id: 'a', qty: 1 },
    { id: 'b', qty: 2 },
    { id: 'c', qty: 1 },
  ];

  it('считает строки, количество и итог для нескольких книг', () => {
    const result = calcCart(items, BOOKS, null);

    expect(result.lines.map((line) => line.lineTotal)).toEqual([1190, 1980, 690]);
    expect(result.count).toBe(4);
    expect(result.subtotal).toBe(3860);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(3860);
  });

  it('пустая корзина даёт 0', () => {
    const result = calcCart([], BOOKS, null);

    expect(result.lines).toEqual([]);
    expect(result.count).toBe(0);
    expect(result.total).toBe(0);
  });

  it('SALE10 даёт скидку 10%', () => {
    const result = calcCart(items, BOOKS, 'SALE10');

    expect(result.promo).toBe('SALE10');
    expect(result.discount).toBe(386);
    expect(result.total).toBe(3474);
  });

  it('неизвестный промокод не даёт скидки', () => {
    const result = calcCart(items, BOOKS, 'WRONG');

    expect(result.promo).toBeNull();
    expect(result.discount).toBe(0);
    expect(result.total).toBe(3860);
  });
});
