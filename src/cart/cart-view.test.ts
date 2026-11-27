import { describe, expect, it } from 'vitest';
import { formatItemsCount, getFocusAfterRemove, getPromoHint, PROMO_HINTS } from './cart-view';

describe('formatItemsCount', () => {
  it('склоняет «товар» по числу', () => {
    expect(formatItemsCount(0)).toBe('0 товаров');
    expect(formatItemsCount(1)).toBe('1 товар');
    expect(formatItemsCount(4)).toBe('4 товара');
    expect(formatItemsCount(11)).toBe('11 товаров');
    expect(formatItemsCount(21)).toBe('21 товар');
  });
});

describe('getPromoHint', () => {
  it('без действий — подсказка про SALE10', () => {
    expect(getPromoHint(false, null)).toEqual({ text: PROMO_HINTS.default, tone: 'default' });
  });

  it('после успешного применения — «Промокод применён»', () => {
    expect(getPromoHint(false, 'applied')).toEqual({ text: PROMO_HINTS.applied, tone: 'success' });
  });

  it('неизвестный код — ошибка', () => {
    expect(getPromoHint(false, 'unknown')).toEqual({ text: PROMO_HINTS.unknown, tone: 'error' });
  });

  it('пустая корзина — подсказка, что промокод недоступен, что бы ни было до этого', () => {
    const empty = { text: PROMO_HINTS.empty, tone: 'default' };
    expect(getPromoHint(true, null)).toEqual(empty);
    expect(getPromoHint(true, 'unknown')).toEqual(empty);
    expect(getPromoHint(false, 'empty')).toEqual(empty);
  });
});

describe('getFocusAfterRemove', () => {
  const ids = ['a', 'b', 'c'];

  it('фокус на следующую строку', () => {
    expect(getFocusAfterRemove(ids, 'a')).toBe('b');
    expect(getFocusAfterRemove(ids, 'b')).toBe('c');
  });

  it('удалили последнюю строку — фокус на предыдущую', () => {
    expect(getFocusAfterRemove(ids, 'c')).toBe('b');
  });

  it('удалили единственную строку — null (фокус на «Перейти в каталог»)', () => {
    expect(getFocusAfterRemove(['a'], 'a')).toBeNull();
  });

  it('неизвестный id — null', () => {
    expect(getFocusAfterRemove(ids, 'x')).toBeNull();
  });
});
