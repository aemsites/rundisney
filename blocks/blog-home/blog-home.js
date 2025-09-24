import { createOptimizedPicture } from '../../scripts/aem.js';
import { createElement } from '../../utils/dom.js';
import { parseUrlParams, applyFilters, formatCategoryLabel } from '../blog-filter/blog-filter.js';
import { formatDate } from '../../utils/date.js';

const PAGE_SIZE = 10;
const state = {
  allItems: [],
  filteredItems: [],
  renderedCount: 0,
  observer: null,
  totalCount: 0,
};

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
    author,
    tags,
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
  const h3 = createElement('h3', { class: 'blog-home-card-title' }, title.replace(' | runDisney Blog', '') || '');
  const meta = createElement('p', { class: 'blog-home-card-date' }, date ? `${formatDate(date)} ${author ? `by ${author}` : ''}` : '');
  const desc = createElement('p', { class: 'blog-home-card-desc' }, description || '');
  const tagsElement = createElement('p', { class: 'blog-home-card-tags' }, tags ? tags.map((tag) => {
    // Use the same formatting logic as the blog filter dropdown
    const displayName = formatCategoryLabel(tag);
    // Create URL-friendly version for filtering
    const urlFriendly = tag.replace(/^categories\//, '').replace(/\s+/g, '-').toLowerCase();
    return `<a href="/blog?category=${urlFriendly}" class="blog-home-card-tags-link">${displayName}</a>`;
  }).join(', ') : '');
  tagsElement.prepend('Categories: ');
  body.append(h3, meta, desc, tagsElement);
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

  try {
    state.allItems = await window.fetchBlogIndex();
    state.totalCount = window.blogIndexTotalCount || state.allItems.length;

    // Check if there are URL parameters for filtering
    const urlParams = parseUrlParams();
    const hasFilterParams = urlParams.categories.length > 0 || urlParams.months.length > 0;

    if (hasFilterParams) {
      // Apply filters directly based on URL parameters
      const filteredItems = applyFilters(state.allItems, urlParams.categories, urlParams.months);
      updateResults(filteredItems, state.totalCount);
    } else {
      // No filter parameters, show all results
      updateResults(state.allItems, state.totalCount);
    }
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
