import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  const childrenLength = block.children.length;
  block.classList.add(`size-${childrenLength}`);

  if (block.classList.contains('overlay')) {
    if (block.querySelector('a')) {
      block.classList.add('clickable');
    }
  }

  const isClickable = block.classList.contains('clickable');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });

    const anchor = li.querySelector('a');

    if (isClickable && anchor) {
      const anchorClone = anchor.cloneNode(true);
      anchor.closest('p').remove();
      const children = [...li.children];
      anchorClone.innerHTML = '';
      children.forEach((child) => anchorClone.appendChild(child));
      li.innerHTML = '';
      li.appendChild(anchorClone);
    }

    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
}
