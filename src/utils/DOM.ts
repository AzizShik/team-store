type ElementOptions = {
  className?: string;
  text?: string;
  attrs?: Record<string, string | number | boolean | undefined>;
  dataset?: Record<string, string | number>;
  on?: Partial<Record<keyof HTMLElementEventMap, EventListener>>;
};

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  { className, text, attrs = {}, dataset = {}, on = {} }: ElementOptions = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;

  for (const [name, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    element.setAttribute(name, value === true ? '' : String(value));
  }

  for (const [key, value] of Object.entries(dataset)) {
    element.dataset[key] = String(value);
  }

  for (const [event, handler] of Object.entries(on)) {
    if (handler) element.addEventListener(event, handler);
  }

  for (const child of children) element.append(child);

  return element;
}
