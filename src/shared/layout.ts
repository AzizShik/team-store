import '../styles/index.css';
import { initCartCount } from '../cart/cart-count';

initCartCount();

export function mount(title: string): HTMLElement {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) throw new Error('Не найден контейнер #app');
  const h1 = document.createElement('h1');
  h1.textContent = title;
  app.append(h1);
  return app;
}
