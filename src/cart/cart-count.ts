import { getItemsCount } from './cart';
import type { CartState } from './storage';
import { getCart, subscribe } from './store';

const MAX_VISIBLE_COUNT = 99;

export interface CartCountView {
  text: string;
  hidden: boolean;
  label: string | null;
}

export function getCartCountView(count: number): CartCountView {
  return {
    text: count > MAX_VISIBLE_COUNT ? `${MAX_VISIBLE_COUNT}+` : String(count),
    hidden: count <= 0,
    label: count > 0 ? `Корзина, товаров: ${count}` : null,
  };
}

function renderCartCount(state: CartState): void {
  const view = getCartCountView(getItemsCount(state.items));

  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((badge) => {
    badge.textContent = view.text;
    badge.hidden = view.hidden;

    // Точное число — для скринридеров, в бейдже может быть «99+»
    const link = badge.closest('a');
    if (!link) return;
    if (view.label) link.setAttribute('aria-label', view.label);
    else link.removeAttribute('aria-label');
  });
}

export function initCartCount(): void {
  renderCartCount(getCart());
  subscribe(renderCartCount);
}
