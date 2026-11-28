import { describe, it } from 'node:test';
import { Book } from '../data/books';
import { filterBooks, Filters } from './filter';
import { expect } from 'vitest';

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: '1',
  title: '1984',
  author: 'Джордж Оруэлл',
  category: 'fiction',
  price: 690,
  ...overrides,
});

const BOOKS: Book[] = [
  makeBook(),
  makeBook({ id: '2', title: 'Дюна', author: 'Фрэнк Герберт', price: 1190 }),
  makeBook({ id: '3', title: 'Sapiens', category: 'nonfiction', price: 1490 }),
  makeBook({ id: '4', title: 'Цветы зла', category: 'poetry', price: 790 }),
];

const filters = (overrides: Partial<Filters> = {}): Filters => ({
  query: '',
  category: '',
  minPrice: null,
  maxPrice: null,
  sort: 'default',
  ...overrides,
});

describe('filterBooks', () => {
  it('при пустых фильтрах возвращает все книги', () => {
    expect(filterBooks(BOOKS, filters())).toEqual(BOOKS);
  });
});
