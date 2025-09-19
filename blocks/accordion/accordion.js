import { createElement, createIcon } from '../../utils/dom.js';

export default function decorate(block) {
  const accordionItems = block.querySelectorAll(':scope > div');

  accordionItems.forEach((item) => {
    const [header, content] = item.children;

    if (!header || !content) return;

    const details = createElement('details', { class: 'accordion-item' });

    const summary = createElement('summary', {}, [
      createIcon('norgie-opened'),
      createElement('span', { class: 'accordion-title' }, header.textContent),
    ]);

    const accordionContent = createElement('div', {}, content.innerHTML);

    details.appendChild(summary);
    details.appendChild(accordionContent);
    block.appendChild(details);
  });

  block.querySelectorAll(':scope > div:not(.accordion-item)').forEach((div) => div.remove());
}
