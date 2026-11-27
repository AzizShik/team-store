import { describe, expect, it } from 'vitest';
import { pluralize, type PluralForms } from './plural';

const GOODS: PluralForms = ['товар', 'товара', 'товаров'];

describe('pluralize', () => {
  it('1, 21, 101 — первая форма', () => {
    expect(pluralize(1, GOODS)).toBe('товар');
    expect(pluralize(21, GOODS)).toBe('товар');
    expect(pluralize(101, GOODS)).toBe('товар');
  });

  it('2–4, 22–24 — вторая форма', () => {
    expect(pluralize(2, GOODS)).toBe('товара');
    expect(pluralize(4, GOODS)).toBe('товара');
    expect(pluralize(23, GOODS)).toBe('товара');
  });

  it('0, 5–20, 25 — третья форма', () => {
    expect(pluralize(0, GOODS)).toBe('товаров');
    expect(pluralize(5, GOODS)).toBe('товаров');
    expect(pluralize(20, GOODS)).toBe('товаров');
    expect(pluralize(25, GOODS)).toBe('товаров');
  });

  it('11–14 — третья форма, хотя оканчиваются на 1–4', () => {
    expect(pluralize(11, GOODS)).toBe('товаров');
    expect(pluralize(12, GOODS)).toBe('товаров');
    expect(pluralize(14, GOODS)).toBe('товаров');
    expect(pluralize(111, GOODS)).toBe('товаров');
    expect(pluralize(1012, GOODS)).toBe('товаров');
  });
});
