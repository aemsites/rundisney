import { buildBlock, decorateBlock, loadBlock } from '../../scripts/aem.js';
import { createElement } from '../../utils/dom.js';

function buildFeaturedCard(item) {
  const {
    path,
    title,
    image,
  } = item;

  const imageHtml = image ? `<picture><img src="${image}" alt="${title}"></picture>` : '';
  const titleHtml = `<h3>${title.replace(' | runDisney Blog', '')}</h3>`;
  const linkHtml = `<a href="${path}">Read More</a>`;
  return [imageHtml, titleHtml, linkHtml];
}

export default async function decorate(block) {
  try {
    if (!window.fetchBlogIndex) {
      throw new Error('fetchBlogIndex is not available on window object');
    }

    const allItems = await window.fetchBlogIndex();
    const currentPath = window.location.pathname;

    const { featuredItems, nonFeaturedItems } = allItems.reduce((acc, item) => {
      if (item.path === currentPath) {
        return acc;
      }

      const hasFeaturedTag = item.tags?.some((tag) => tag.toLowerCase().includes('featured'));
      if (hasFeaturedTag) {
        acc.featuredItems.push(item);
      } else {
        acc.nonFeaturedItems.push(item);
      }
      return acc;
    }, { featuredItems: [], nonFeaturedItems: [] });

    let itemsToShow = [...featuredItems];

    if (itemsToShow.length < 3) {
      const needed = 3 - itemsToShow.length;
      itemsToShow = [...itemsToShow, ...nonFeaturedItems.slice(0, needed)];
    } else {
      itemsToShow = itemsToShow.slice(0, 3);
    }

    if (itemsToShow.length === 0) {
      block.innerHTML = '<p>No featured blog posts found.</p>';
      return;
    }

    const cardsContent = itemsToShow.map((item) => buildFeaturedCard(item));
    const cardsBlock = buildBlock('cards', cardsContent);
    cardsBlock.classList.add('clickable');

    block.innerHTML = '';
    block.appendChild(createElement('h3', {}, 'Featured Blogs'));
    block.appendChild(cardsBlock);
    decorateBlock(cardsBlock);
    await loadBlock(cardsBlock);
  } catch (error) {
    block.innerHTML = `<p>Failed to load featured blog posts: ${error.message}</p>`;
  }
}
