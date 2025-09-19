import { createOptimizedPicture } from '../../scripts/aem.js';
import { createElement } from '../../utils/dom.js';

const PAGE_SIZE = 10;
const state = {
  allItems: [],
  filteredItems: [],
  renderedCount: 0,
  observer: null,
  totalCount: 0,
};

/**
 * Formats a unix epoch seconds date to "Month D, YYYY".
 * @param {number} epochSeconds
 * @returns {string}
 */
function formatDate(epochSeconds) {
  const date = new Date(epochSeconds * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Builds a post card element.
 * @param {object} item
 * @returns {HTMLElement}
 */
function buildPostCard(item) {
  const {
    path,
    title,
    description,
    image,
    date,
  } = item;
  const article = createElement('article', { class: 'blog-home-card' });
  const link = createElement('a', { href: path, 'aria-label': title });

  if (image) {
    const picture = createOptimizedPicture(
      image,
      title,
      false,
      [
        {
          media: '(min-width: 900px)',
          width: '1200',
        },
        {
          media: '(min-width: 600px)',
          width: '900',
        },
        {
          width: '600',
        },
      ],
    );
    picture.classList.add('blog-home-card-image');
    link.append(picture);
  }

  const body = createElement('div', { class: 'blog-home-card-body' });
  const h3 = createElement('h3', { class: 'blog-home-card-title' }, title || '');
  const meta = createElement('p', { class: 'blog-home-card-date' }, date ? formatDate(date) : '');
  const desc = createElement('p', { class: 'blog-home-card-desc' }, description || '');
  body.append(h3, meta, desc);
  link.append(body);
  article.append(link);

  return article;
}

export default async function decorate(block) {
  // structure
  block.classList.add('blog-home');

  // Create blog-filters block
  const totalResults = createElement('div', { class: 'blog-home-total-results' }, '0 results');
  const results = createElement('div', { class: 'blog-home-results' });
  const noResults = createElement('p', { class: 'blog-home-no-results' }, 'No articles found.');
  noResults.style.display = 'none';
  const sentinel = createElement('div', { class: 'blog-home-sentinel' });

  block.innerHTML = '';
  block.append(totalResults, results, noResults, sentinel);

  // helpers
  const clearResults = () => {
    results.innerHTML = '';
    state.renderedCount = 0;
  };

  const renderNextPage = () => {
    const start = state.renderedCount;
    const end = Math.min(start + PAGE_SIZE, state.filteredItems.length);
    if (start >= end) return;
    const fragment = document.createDocumentFragment();
    for (let i = start; i < end; i += 1) fragment.append(buildPostCard(state.filteredItems[i]));
    results.append(fragment);
    state.renderedCount = end;
  };

  const updateNoResultsVisibility = () => { noResults.style.display = state.filteredItems.length === 0 ? '' : 'none'; };

  const setupInfiniteScroll = () => {
    if (state.observer) state.observer.disconnect();
    state.observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry || !entry.isIntersecting) return;
      renderNextPage();
      if (state.renderedCount >= state.filteredItems.length) state.observer.disconnect();
    }, { rootMargin: '250px 0px' });
    state.observer.observe(sentinel);
  };

  const updateResults = (filteredItems, totalCount) => {
    state.filteredItems = filteredItems;
    state.totalCount = totalCount;
    totalResults.textContent = `${filteredItems.length} results`;
    clearResults();
    updateNoResultsVisibility();
    renderNextPage();
    setupInfiniteScroll();
  };

  // load data using cached fetchBlogIndex
  try {
    state.allItems = await window.fetchBlogIndex();
    state.totalCount = window.blogIndexTotalCount || state.allItems.length;
    updateResults(state.allItems, state.totalCount);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    noResults.textContent = 'Failed to load blog posts.';
    noResults.style.display = '';
    return;
  }

  // Initialize blog-filters block
  try {
    // Listen for filter changes from the blog-filters block
    window.addEventListener('blog-filter-change', (event) => {
      const { filteredItems, totalCount } = event.detail;
      updateResults(filteredItems, totalCount);
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to load blog-filters block:', e);
    // Fallback: show all items without filters
    updateResults(state.allItems, state.totalCount);
  }
}
