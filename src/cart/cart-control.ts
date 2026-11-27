import { BOOKS } from '../data/books';
import { createElement } from '../utils/DOM';
import { getItemQty } from './cart';
import type { CartState } from './storage';
import { addToCart, changeCartQty, getCart, subscribe } from './store';

export type CartControlSize = 'card' | 'large';

export interface CartControlOptions {
  size?: CartControlSize;
  /** Дополнительный класс корня — для размещения контрола в карточке */
  className?: string;
}

const CONTROL_SELECTOR = '[data-cart-control]';

interface ControlParts {
  button: HTMLButtonElement;
  stepper: HTMLElement;
  qty: HTMLElement;
}

function getParts(root: HTMLElement): ControlParts | null {
  const button = root.querySelector<HTMLButtonElement>('.cart-control__button');
  const stepper = root.querySelector<HTMLElement>('.cart-control__stepper');
  const qty = root.querySelector<HTMLElement>('.cart-control__qty');
  return button && stepper && qty ? { button, stepper, qty } : null;
}

// Кнопка, если книги нет в корзине, иначе степпер с количеством
function renderControl(root: HTMLElement, state: CartState): void {
  const parts = getParts(root);
  const bookId = root.dataset.bookId;
  if (!parts || !bookId) return;

  const qty = getItemQty(state.items, bookId);
  parts.button.hidden = qty > 0;
  parts.stepper.hidden = qty === 0;
  parts.qty.textContent = String(qty);
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
  { size = 'card', className }: CartControlOptions = {},
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
    className: 'cart-control__step',
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
      dataset: { cartControl: '', bookId },
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
    changeCartQty(bookId, -1);
    if (stepper.hidden) button.focus();
  });

  plus.addEventListener('click', () => {
    changeCartQty(bookId, 1);
  });

  renderControl(root, getCart());
  return root;
}
