import { createElement, createIcon } from '../../utils/dom.js';

export default function decorate(block) {
  const icon = block.querySelector('.icon, [class*="icon__"], [class*="icon-"]');
  const link = block.querySelector('a');

  const linkHref = link ? link.href : null;

  if (icon) {
    icon.remove();
  }

  const content = createElement('div', { class: 'callout-content' });

  while (block.firstChild) {
    content.appendChild(block.firstChild);
  }

  const linkInContent = content.querySelector('a');
  if (linkInContent) {
    linkInContent.remove();
  }

  block.textContent = '';

  if (icon) {
    const iconContainer = createElement('div', { class: 'callout-icon' }, icon);
    block.appendChild(iconContainer);
  }

  block.appendChild(content);

  if (linkHref) {
    const chevron = createIcon('next');
    chevron.classList.add('callout-chevron');
    block.appendChild(chevron);

    block.classList.add('callout-clickable');
    block.addEventListener('click', () => {
      window.location.href = linkHref;
    });
  }
}
