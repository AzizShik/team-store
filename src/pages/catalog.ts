import '../shared/layout';
import '../styles/pages/catalog.css';
import { Book, BOOKS, coverUrl } from '../data/books';
import { createElement } from '../utils/DOM';
import { formatPrice } from '../shared/format';
import { pluralize } from '../shared/plural';
import { filterBooks, Filters } from '../catalog/filter';

const CATEGORY_BADGES: Record<string, string> = {
  fiction: 'Художественная',
  nonfiction: 'Нон-фикшн',
  poetry: 'Поэзия',
};

const BOOK_FORMS = ['книга', 'книги', 'книг'] as const;
const CATEGORY_FORMS = ['категория', 'категории', 'категорий'] as const;

const form = document.querySelector<HTMLFormElement>('[data-catalog-filters]');
const empty = document.querySelector<HTMLElement>('[data-catalog-empty]');
const meta = document.querySelector<HTMLElement>('[data-catalog-meta]');
const emptyReset = document.querySelector<HTMLButtonElement>('[data-catalog-empty-reset]');

const grid = document.querySelector<HTMLElement>('[data-catalog-grid]');

function renderBooks(books: Book[]): void {
  if (!grid) return;

  const fragment = document.createDocumentFragment();

  for (const book of books) {
    const cover = createElement('img', {
      className: 'catalog-card__cover',
      attrs: {
        src: coverUrl(book),
        alt: `Обложка книги «${book.title}»`,
        loading: 'lazy',
      },
    });

    const badge = createElement('span', {
      className: 'catalog-card__badge',
      text: CATEGORY_BADGES[book.category] ?? book.category,
    });
    const titleLink = createElement('a', {
      className: 'catalog-card__link',
      text: book.title,
      attrs: { href: `./book.html?id=${book.id}` },
    });
    const title = createElement('h2', { className: 'catalog-card__title' }, [titleLink]);
    const author = createElement('p', {
      className: 'catalog-card__author',
      text: book.author,
    });
    const price = createElement('p', {
      className: 'catalog-card__price',
      text: formatPrice(book.price),
    });
    const cta = createElement('button', {
      className: 'catalog-card__cta',
      text: 'В корзину',
      attrs: {
        type: 'button',
        'aria-label': `Добавить «${book.title}» в корзину`,
      },
    });

    const bottom = createElement('div', { className: 'catalog-card__bottom' }, [price, cta]);
    const body = createElement('div', { className: 'catalog-card__body' }, [
      badge,
      title,
      author,
      bottom,
    ]);
    const card = createElement(
      'article',
      { className: 'catalog-card', dataset: { bookId: book.id } },
      [cover, body],
    );

    fragment.append(card);
  }

  grid.replaceChildren(fragment);
}

function readFilters(): Filters | null {
  if (!form) return null;

  const data = new FormData(form);

  const parsePrice = (name: string): number | null => {
    const raw = data.get(name);
    if (raw === null || String(raw).trim() === '') return null;

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  const sort = String(data.get('sort') ?? 'default');

  return {
    query: String(data.get('search') ?? '')
      .trim()
      .toLowerCase(),
    category: String(data.get('category') ?? ''),
    minPrice: parsePrice('minPrice'),
    maxPrice: parsePrice('maxPrice'),
    sort: sort === 'price-asc' || sort === 'price-desc' ? sort : 'default',
  };
}

function updateCatalog(): void {
  const filters = readFilters();

  if (!filters || !grid) return;

  const visible = filterBooks(BOOKS, filters);

  renderBooks(visible);

  if (grid) grid.hidden = visible.length === 0;
  if (empty) empty.hidden = visible.length > 0;

  if (meta) {
    if (!empty?.hidden) {
      meta.textContent = '0 книг · фильтры не дали результата';
    } else {
      const categories = new Set(visible.map((book) => book.category)).size;

      meta.textContent =
        `${visible.length} ${pluralize(visible.length, BOOK_FORMS)} · ` +
        `${categories} ${pluralize(categories, CATEGORY_FORMS)}`;
    }
  }
}

form?.addEventListener('input', updateCatalog);

form?.addEventListener('submit', (event) => {
  event.preventDefault();
});

form?.addEventListener('reset', () => {
  requestAnimationFrame(updateCatalog);
});

emptyReset?.addEventListener('click', () => {
  form?.reset();
  requestAnimationFrame(updateCatalog);
});

updateCatalog();
