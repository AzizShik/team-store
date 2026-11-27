import { describe, expect, it } from 'vitest';
import { getCartCountView } from './cart-count';

describe('getCartCountView', () => {
  it('при пустой корзине счётчик скрыт и без подписи', () => {
    expect(getCartCountView(0)).toEqual({ text: '0', hidden: true, label: null });
  });

  it('показывает количество товаров', () => {
    expect(getCartCountView(3)).toEqual({
      text: '3',
      hidden: false,
      label: 'Корзина, товаров: 3',
    });
  });

  it('99 показывается как есть', () => {
    expect(getCartCountView(99).text).toBe('99');
  });

  it('больше 99 показывается как 99+, а в подписи точное число', () => {
    expect(getCartCountView(150)).toEqual({
      text: '99+',
      hidden: false,
      label: 'Корзина, товаров: 150',
    });
  });
});
