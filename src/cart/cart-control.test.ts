import { describe, expect, it } from 'vitest';
import { getCartControlView } from './cart-control';

describe('getCartControlView', () => {
  describe('по умолчанию (min = 0): карточка каталога, страница товара', () => {
    it('книги нет в корзине — показываем кнопку «В корзину»', () => {
      expect(getCartControlView(0)).toEqual({ showButton: true, isMinusDisabled: false });
    });

    it('книга в корзине — степпер, «−» доступен даже на 1 (уменьшение до 0 удаляет)', () => {
      expect(getCartControlView(1)).toEqual({ showButton: false, isMinusDisabled: false });
      expect(getCartControlView(5)).toEqual({ showButton: false, isMinusDisabled: false });
    });
  });

  describe('min = 1: страница корзины', () => {
    it('кнопка не показывается никогда', () => {
      expect(getCartControlView(1, 1).showButton).toBe(false);
      expect(getCartControlView(0, 1).showButton).toBe(false);
    });

    it('на минимуме «−» заблокирован', () => {
      expect(getCartControlView(1, 1).isMinusDisabled).toBe(true);
    });

    it('выше минимума «−» доступен', () => {
      expect(getCartControlView(2, 1).isMinusDisabled).toBe(false);
      expect(getCartControlView(1000, 1).isMinusDisabled).toBe(false);
    });
  });
});
