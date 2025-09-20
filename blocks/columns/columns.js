export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  block.classList.forEach((className) => {
    if (/^\d/.test(className)) {
      const columnSplitClass = `col-${className}`;
      block.classList.replace(className, columnSplitClass);
    }
  });

  if (block.classList.contains('icon-separator')) {
    [...block.children].forEach((row) => {
      const columns = [...row.children];

      const icons = row.querySelectorAll('.icon, [class*="icon__"], [class*="icon-"]');

      icons.forEach((icon) => {
        const parentP = icon.closest('p');
        if (parentP) {
          parentP.remove();
        }
      });

      columns.forEach((col) => {
        if (col.querySelector('picture')) {
          return;
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'columns-content';

        while (col.firstChild) {
          contentDiv.appendChild(col.firstChild);
        }

        col.appendChild(contentDiv);
      });

      columns.forEach((col, index) => {
        if (index < columns.length - 1 && icons.length > 0) {
          const icon = icons[0];

          const separator = document.createElement('div');
          separator.className = 'columns-icon-separator';

          const iconClone = icon.cloneNode(true);
          separator.appendChild(iconClone);

          col.parentNode.insertBefore(separator, col.nextSibling);
        }
      });
    });
  }

  [...block.children].forEach((row) => {
    const columns = [...row.children];

    columns.forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
