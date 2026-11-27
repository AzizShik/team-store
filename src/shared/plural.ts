/** Формы слова для 1, 2 и 5: ['товар', 'товара', 'товаров'] */
export type PluralForms = readonly [one: string, few: string, many: string];

/** Возвращает форму слова для числа (без самого числа): 1 товар, 2 товара, 5 товаров */
export function pluralize(count: number, [one, few, many]: PluralForms): string {
  const n = Math.abs(count) % 100;
  const last = n % 10;

  if (n >= 11 && n <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}
