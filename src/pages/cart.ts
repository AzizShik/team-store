import '../shared/layout';
import { calcCart, type CartLine, type CartSummary } from '../cart/cart';
import { createCartControl } from '../cart/cart-control';
import { formatItemsCount, getFocusAfterRemove, getPromoHint } from '../cart/cart-view';
import { applyPromo, getCart, removeFromCart, subscribe, type PromoResult } from '../cart/store';
import { BOOKS, coverUrl } from '../data/books';
import { formatPrice } from '../shared/format';
import { createElement } from '../utils/DOM';

const CHECKOUT_MESSAGE = 'Оформление заказа пока не реализовано.';

// Не перезаписываем одинаковый текст, чтобы aria-live не объявлял его повторно
function setText(element: HTMLElement, text: string): void {
  if (element.textContent !== text) element.textContent = text;
}

function createLine({ book, lineTotal }: CartLine, onRemove: (id: string) => void): HTMLElement {
  const href = `./book.html?id=${book.id}`;

  // Обложка дублирует ссылку-название, поэтому скрыта от клавиатуры и скринридера
  const cover = createElement(
    'a',
    {
      className: 'cart-item__cover-link',
      attrs: { href, tabindex: -1, 'aria-hidden': 'true' },
    },
    [
      createElement('img', {
        className: 'cart-item__cover',
        attrs: { src: coverUrl(book), alt: '', width: 72, height: 108, loading: 'lazy' },
      }),
    ],
  );

  const title = createElement('h2', { className: 'cart-item__title' }, [
    createElement('a', { className: 'cart-item__link', text: book.title, attrs: { href } }),
  ]);

  const info = createElement('div', { className: 'cart-item__info' }, [
    title,
    createElement('p', { className: 'cart-item__author', text: book.author }),
    createElement('p', {
      className: 'cart-item__price',
      text: `${formatPrice(book.price)} за шт.`,
    }),
  ]);

  const control = createCartControl(book.id, { min: 1, className: 'cart-item__qty' });
  const total = createElement('p', { className: 'cart-item__total', text: formatPrice(lineTotal) });

  // «×» на десктопе и планшете, «Удалить» на мобиле — переключается в CSS
  const remove = createElement(
    'button',
    {
      className: 'cart-item__remove',
      attrs: { type: 'button', 'aria-label': `Удалить «${book.title}» из корзины` },
    },
    [
      createElement('span', {
        className: 'cart-item__remove-icon',
        text: '×',
        attrs: { 'aria-hidden': 'true' },
      }),
      createElement('span', { className: 'cart-item__remove-text', text: 'Удалить' }),
    ],
  );
  remove.addEventListener('click', () => onRemove(book.id));

  return createElement('li', { className: 'cart-item', dataset: { bookId: book.id } }, [
    cover,
    info,
    control,
    total,
    remove,
  ]);
}

function createEmptyBlock(): { block: HTMLElement; link: HTMLAnchorElement } {
  const link = createElement('a', {
    className: 'cart-empty__link',
    text: 'Перейти в каталог',
    attrs: { href: './catalog.html' },
  });

  const block = createElement('div', { className: 'cart-empty' }, [
    createElement('span', { className: 'cart-empty__icon', attrs: { 'aria-hidden': 'true' } }),
    createElement('h2', { className: 'cart-empty__title', text: 'В корзине пока пусто' }),
    createElement('p', {
      className: 'cart-empty__text',
      text: 'Добавьте книги из каталога — они появятся здесь. Цены, количество и промокод сохранятся до оформления.',
    }),
    link,
  ]);

  return { block, link };
}

function initCartPage(app: HTMLElement): void {
  // Результат последнего применения промокода — только для подсказки, в корзине не хранится
  let promoStatus: PromoResult | null = null;
  // Ключ отрисованного списка: список перестраиваем, только когда меняется набор книг
  let renderedKey: string | null = null;
  let renderedIds: string[] = [];

  const items = createElement('section', {
    className: 'cart-page__items',
    attrs: { 'aria-label': 'Товары в корзине' },
  });
  const empty = createEmptyBlock();

  // Итого
  const countValue = createElement('span', { className: 'cart-summary__count' });
  const subtotalValue = createElement('span', { className: 'cart-summary__subtotal' });

  const promoInput = createElement('input', {
    className: 'promo-form__input',
    attrs: {
      type: 'text',
      name: 'promo',
      placeholder: 'Промокод',
      autocomplete: 'off',
      'aria-label': 'Промокод',
      'aria-describedby': 'promo-hint',
    },
  });
  promoInput.value = getCart().promo ?? '';

  const promoButton = createElement('button', {
    className: 'promo-form__button',
    text: 'Применить',
    attrs: { type: 'submit' },
  });
  const promoForm = createElement(
    'form',
    { className: 'promo-form', attrs: { novalidate: true } },
    [promoInput, promoButton],
  );
  const promoHint = createElement('p', {
    className: 'promo-hint',
    attrs: { id: 'promo-hint', 'aria-live': 'polite' },
  });

  const discountLabel = createElement('span');
  const discountValue = createElement('span', { className: 'cart-summary__discount' });
  const discountRow = createElement(
    'p',
    { className: 'cart-summary__row cart-summary__row--discount' },
    [discountLabel, discountValue],
  );

  const totalValue = createElement('span', { className: 'cart-summary__total-value' });

  const checkout = createElement('button', {
    className: 'cart-summary__checkout',
    text: 'Оформить заказ',
    attrs: { type: 'button' },
  });
  const note = createElement('p', {
    className: 'cart-summary__note',
    text: 'Кнопка-заглушка: оплата вне рамок учебного проекта.',
  });
  const checkoutMessage = createElement('p', {
    className: 'cart-summary__message',
    attrs: { 'aria-live': 'polite' },
  });

  const summary = createElement(
    'aside',
    { className: 'cart-summary', attrs: { 'aria-labelledby': 'cart-summary-title' } },
    [
      createElement('h2', {
        className: 'cart-summary__title title-subsection',
        text: 'Итого',
        attrs: { id: 'cart-summary-title' },
      }),
      createElement('p', { className: 'cart-summary__row' }, [countValue, subtotalValue]),
      promoForm,
      promoHint,
      discountRow,
      createElement('p', { className: 'cart-summary__total' }, [
        createElement('span', { className: 'cart-summary__total-label', text: 'К оплате' }),
        totalValue,
      ]),
      checkout,
      note,
      checkoutMessage,
    ],
  );

  app.append(
    createElement('div', { className: 'container cart-page' }, [
      createElement('h1', { className: 'cart-page__title title-page', text: 'Корзина' }),
      createElement('div', { className: 'cart-page__layout' }, [items, summary]),
    ]),
  );

  function handleRemove(id: string): void {
    const focusId = getFocusAfterRemove(renderedIds, id);
    removeFromCart(id); // подписка перерисовывает список синхронно
    const target = focusId
      ? items.querySelector<HTMLElement>(`.cart-item[data-book-id="${focusId}"] .cart-item__remove`)
      : empty.link;
    target?.focus();
  }

  function renderItems(cart: CartSummary): void {
    const ids = cart.lines.map((line) => line.book.id);
    const key = ids.join(',');

    if (key !== renderedKey) {
      renderedKey = key;
      renderedIds = ids;
      items.replaceChildren(
        ids.length === 0
          ? empty.block
          : createElement(
              'ul',
              { className: 'cart-list' },
              cart.lines.map((line) => createLine(line, handleRemove)),
            ),
      );
      return;
    }

    // Набор книг тот же: количество обновляет сам степпер, здесь — только сумма строки
    for (const line of cart.lines) {
      const total = items.querySelector<HTMLElement>(
        `.cart-item[data-book-id="${line.book.id}"] .cart-item__total`,
      );
      if (total) setText(total, formatPrice(line.lineTotal));
    }
  }

  function renderSummary(cart: CartSummary): void {
    const isEmpty = cart.lines.length === 0;
    const hint = getPromoHint(isEmpty, promoStatus);
    const isError = hint.tone === 'error';

    setText(countValue, formatItemsCount(cart.count));
    setText(subtotalValue, formatPrice(cart.subtotal));

    promoInput.disabled = isEmpty;
    promoButton.disabled = isEmpty;
    promoInput.setAttribute('aria-invalid', String(isError));
    promoForm.classList.toggle('promo-form--error', isError);
    setText(promoHint, hint.text);
    promoHint.className = `promo-hint promo-hint--${hint.tone}`;

    discountRow.hidden = cart.discount === 0;
    setText(discountLabel, `Скидка ${cart.promo ?? ''}`);
    setText(discountValue, `−${formatPrice(cart.discount)}`);
    setText(totalValue, formatPrice(cart.total));

    checkout.disabled = isEmpty;
    note.hidden = isEmpty;
  }

  function render(): void {
    const { items: cartItems, promo } = getCart();
    const cart = calcCart(cartItems, BOOKS, promo);

    // Пустая корзина всегда без промокода — сбрасываем и поле, и сообщения
    if (cart.lines.length === 0) {
      promoStatus = null;
      promoInput.value = '';
      setText(checkoutMessage, '');
    }

    renderItems(cart);
    renderSummary(cart);
  }

  promoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (promoInput.value.trim() === '') return;

    promoStatus = applyPromo(promoInput.value);
    if (promoStatus === 'applied') promoInput.value = getCart().promo ?? '';
    render();
  });

  // Начали править код — убираем старое сообщение и красную рамку
  promoInput.addEventListener('input', () => {
    if (promoStatus === null) return;
    promoStatus = null;
    render();
  });

  checkout.addEventListener('click', () => {
    setText(checkoutMessage, CHECKOUT_MESSAGE);
  });

  render();
  subscribe(render);
}

const app = document.querySelector<HTMLElement>('#app');
if (app) initCartPage(app);
