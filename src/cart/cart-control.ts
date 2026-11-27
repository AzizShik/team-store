import { BOOKS } from '../data/books';
import { createElement } from '../utils/DOM';
import { getItemQty } from './cart';
import type { CartState } from './storage';
import { addToCart, changeCartQty, getCart, subscribe } from './store';

export type CartControlSize = 'card' | 'large';

/**
 * Минимальное количество в степпере:
 * 0 — «−» до нуля убирает книгу и возвращает кнопку «В корзину» (каталог, страница товара);
 * 1 — только степпер, «−» не опускает ниже 1, удаление отдельной кнопкой (страница корзины).
 */
export type CartControlMin = 0 | 1;

export interface CartControlOptions {
  size?: CartControlSize;
  min?: CartControlMin;
  /** Дополнительный класс корня — для размещения контрола в карточке */
  className?: string;
}

export interface CartControlView {
  showButton: boolean;
  isMinusDisabled: boolean;
}

export function getCartControlView(qty: number, min: CartControlMin = 0): CartControlView {
  return {
    showButton: min === 0 && qty === 0,
    isMinusDisabled: min > 0 && qty <= min,
  };
}

const CONTROL_SELECTOR = '[data-cart-control]';

interface ControlParts {
  button: HTMLButtonElement;
  stepper: HTMLElement;
  minus: HTMLButtonElement;
  qty: HTMLElement;
}

function getParts(root: HTMLElement): ControlParts | null {
  const button = root.querySelector<HTMLButtonElement>('.cart-control__button');
  const stepper = root.querySelector<HTMLElement>('.cart-control__stepper');
  const minus = root.querySelector<HTMLButtonElement>('.cart-control__step--minus');
  const qty = root.querySelector<HTMLElement>('.cart-control__qty');
  return button && stepper && minus && qty ? { button, stepper, minus, qty } : null;
}

function getMin(root: HTMLElement): CartControlMin {
  return root.dataset.min === '1' ? 1 : 0;
}

// Кнопка, если книги нет в корзине, иначе степпер с количеством
function renderControl(root: HTMLElement, state: CartState): void {
  const parts = getParts(root);
  const bookId = root.dataset.bookId;
  if (!parts || !bookId) return;

  const qty = getItemQty(state.items, bookId);
  const view = getCartControlView(qty, getMin(root));
  parts.button.hidden = !view.showButton;
  parts.stepper.hidden = view.showButton;
  parts.qty.textContent = String(qty);
  // aria-disabled, а не disabled: фокус остаётся на «−», когда количество дошло до минимума
  parts.minus.setAttribute('aria-disabled', String(view.isMinusDisabled));
}

// Одна подписка на все контролы страницы: карточки можно перерисовывать без отписок
let isSubscribed = false;

function ensureSubscription(): void {
  if (isSubscribed) return;
  isSubscribed = true;

  subscribe((state) => {
    document
      .querySelectorAll<HTMLElement>(CONTROL_SELECTOR)
      .forEach((root) => renderControl(root, state));
  });
}

export function createCartControl(
  bookId: string,
  { size = 'card', min = 0, className }: CartControlOptions = {},
): HTMLElement {
  ensureSubscription();

  const title = BOOKS.find((book) => book.id === bookId)?.title;
  const quoted = title ? ` «${title}»` : '';

  const button = createElement('button', {
    className: 'cart-control__button',
    text: 'В корзину',
    attrs: { type: 'button', 'aria-label': `Добавить${quoted} в корзину` },
  });

  const minus = createElement('button', {
    className: 'cart-control__step cart-control__step--minus',
    text: '−',
    attrs: { type: 'button', 'aria-label': 'Уменьшить количество' },
  });

  const qty = createElement('span', {
    className: 'cart-control__qty',
    attrs: { 'aria-live': 'polite' },
  });

  const plus = createElement('button', {
    className: 'cart-control__step',
    text: '+',
    attrs: { type: 'button', 'aria-label': 'Увеличить количество' },
  });

  const stepper = createElement(
    'div',
    {
      className: 'cart-control__stepper',
      attrs: { role: 'group', 'aria-label': `Количество${quoted} в корзине` },
    },
    [minus, qty, plus],
  );

  const root = createElement(
    'div',
    {
      className: ['cart-control', `cart-control--${size}`, className].filter(Boolean).join(' '),
      dataset: { cartControl: '', bookId, min: String(min) },
    },
    [button, stepper],
  );

  // Подписка перерисовывает контрол синхронно, поэтому сразу после действия
  // переносим фокус, чтобы он не терялся при смене кнопки и степпера
  button.addEventListener('click', () => {
    addToCart(bookId);
    if (!stepper.hidden) plus.focus();
  });

  minus.addEventListener('click', () => {
    if (minus.getAttribute('aria-disabled') === 'true') return;
    changeCartQty(bookId, -1);
    if (stepper.hidden) button.focus();
  });

  plus.addEventListener('click', () => {
    changeCartQty(bookId, 1);
  });

  renderControl(root, getCart());
  return root;
}
