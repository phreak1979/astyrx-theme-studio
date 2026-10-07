import type { ReactNode } from 'react';

export function Confirm({ message, onConfirm, onCancel, confirmLabel = 'Confirm' }: { message: ReactNode; onConfirm: () => void; onCancel: () => void; confirmLabel?: string }) {
  return (
    <div className="banner warn" role="alertdialog" aria-label="Confirm">
      <div>{message}</div>
      <div className="row">
        <button className="danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Short human label for an element: `div.astryx-card#id`. */
export function describeElement(el: Element): string {
  const cls = Array.from(el.classList).filter((c) => c.startsWith('astryx-'))[0] ?? Array.from(el.classList)[0];
  return `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${cls ? `.${cls}` : ''}`;
}
