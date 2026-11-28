import '../shared/layout';
import { createCartControl } from '../cart/cart-control';
import '../styles/pages/about.css';
import { BOOKS, coverUrl } from '../data/books';
import { formatPrice } from '../shared/format';
import { createElement } from '../utils/DOM';

const PREVIEW_COUNT = 4;
const grid = document.querySelector<HTMLElement>('.catalog-preview__grid');

if (grid) {
  const fragment = document.createDocumentFragment();

  for (const book of BOOKS.slice(0, PREVIEW_COUNT)) {
    const cover = createElement('img', {
      className: 'preview-card__cover',
      attrs: {
        src: coverUrl(book),
        alt: `Обложка книги «${book.title}»`,
        width: 100,
        height: 150,
        loading: 'lazy',
      },
    });

    const title = createElement('a', {
      className: 'preview-card__link',
      text: book.title,
      attrs: { href: `./book.html?id=${book.id}` },
    });

    const heading = createElement('h3', { className: 'preview-card__title' }, [title]);
    const author = createElement('p', {
      className: 'preview-card__author',
      text: book.author,
    });
    const price = createElement('p', {
      className: 'preview-card__price',
      text: formatPrice(book.price),
    });
    const cta = createCartControl(book.id, { className: 'preview-card__cta' });

    const body = createElement('div', { className: 'preview-card__body' }, [
      heading,
      author,
      price,
      cta,
    ]);
    const card = createElement(
      'article',
      { className: 'preview-card', dataset: { bookId: book.id } },
      [cover, body],
    );

    fragment.append(card);
  }

  grid.append(fragment);
}
