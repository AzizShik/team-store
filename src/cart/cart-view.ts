import { pluralize } from '../shared/plural';
import type { PromoResult } from './store';

export const formatItemsCount = (count: number): string =>
  `${count} ${pluralize(count, ['товар', 'товара', 'товаров'])}`;

export const PROMO_HINTS = {
  default: 'Промокод SALE10 даёт скидку 10%. Неизвестный код не применяется.',
  applied: 'Промокод применён',
  unknown: 'Промокод не найден',
  empty: 'Промокод можно применить, когда в корзине есть товары.',
} as const;

export type PromoHintTone = 'default' | 'success' | 'error';

export interface PromoHint {
  text: string;
  tone: PromoHintTone;
}

/** Подсказка под полем промокода: status — результат последнего applyPromo (null — ещё не применяли) */
export function getPromoHint(isEmpty: boolean, status: PromoResult | null): PromoHint {
  if (isEmpty || status === 'empty') return { text: PROMO_HINTS.empty, tone: 'default' };
  if (status === 'applied') return { text: PROMO_HINTS.applied, tone: 'success' };
  if (status === 'unknown') return { text: PROMO_HINTS.unknown, tone: 'error' };
  return { text: PROMO_HINTS.default, tone: 'default' };
}

/** Куда перевести фокус после удаления строки: следующая, иначе предыдущая, иначе null */
export function getFocusAfterRemove(ids: readonly string[], removedId: string): string | null {
  const index = ids.indexOf(removedId);
  if (index === -1) return null;
  return ids[index + 1] ?? ids[index - 1] ?? null;
}
