import { fetchQueryIndex } from '../../scripts/scripts.js';
import { createElement } from '../../utils/dom.js';

export default async function decorate(block) {
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get('q') || '';

  const container = createElement('div', { class: 'search-results-container' });

  const searchForm = createElement('form', { class: 'search-results-form', role: 'search' }, [
    createElement('label', { for: 'search-results-input', class: 'sr-only' }, 'Search'),
    createElement('input', {
      id: 'search-results-input',
      name: 'q',
      type: 'search',
      placeholder: 'Search…',
      value: initialQuery,
      'aria-label': 'Search',
      autocomplete: 'off',
      class: 'search-results-input',
    }),
    createElement('button', { type: 'submit', class: 'button search-results-submit' }, 'Search'),
  ]);

  const tabs = createElement('div', { class: 'search-results-tabs', role: 'tablist' }, [
    createElement('button', {
      role: 'tab',
      id: 'tab-site',
      'aria-controls': 'panel-site',
      'aria-selected': 'true',
      class: ['search-results-tab', 'is-active'],
      type: 'button',
    }, 'Site Search Results'),
    createElement('button', {
      role: 'tab',
      id: 'tab-blog',
      'aria-controls': 'panel-blog',
      'aria-selected': 'false',
      class: 'search-results-tab',
      type: 'button',
    }, 'Blog Search Results'),
  ]);
  const indicator = createElement('div', { class: 'search-results-indicator' });
  tabs.append(indicator);

  const sitePanel = createElement('div', {
    id: 'panel-site',
    role: 'tabpanel',
    'aria-labelledby': 'tab-site',
    class: ['search-results-panel', 'is-active'],
  });
  const blogPanel = createElement('div', {
    id: 'panel-blog',
    role: 'tabpanel',
    'aria-labelledby': 'tab-blog',
    class: 'search-results-panel',
  });

  const resultsInfo = createElement('div', { class: 'search-results-info' });

  container.append(searchForm, tabs, resultsInfo, sitePanel, blogPanel);
  block.textContent = '';
  block.append(container);

  function tokenize(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/g)
      .filter((t) => t && t.length > 1);
  }

  function classifyMatch(item, queryTokens) {
    if (!queryTokens.length) return null;

    const toSet = (arr) => new Set(arr);
    const titleSet = toSet(tokenize(item.title));
    const descSet = toSet(tokenize(item.description));
    const authorSet = toSet(tokenize(item.author));
    const tagsSet = toSet((Array.isArray(item.tags) ? item.tags : []).flatMap((t) => tokenize(t)));

    const hasTitle = queryTokens.some((qt) => titleSet.has(qt));
    if (hasTitle) return 'title';

    const hasTagAuthor = queryTokens.some((qt) => authorSet.has(qt) || tagsSet.has(qt));
    if (hasTagAuthor) return 'tagAuthor';

    const hasDesc = queryTokens.some((qt) => descSet.has(qt));
    if (hasDesc) return 'description';

    return null;
  }

  function formatDate(epochMs) {
    if (!epochMs) return '';
    try {
      const d = new Date(epochMs);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function highlight(text, qTokens) {
    const escaped = escapeHtml(text || '');
    const uniq = Array.from(new Set(qTokens)).filter(Boolean);
    if (!uniq.length) return escaped;
    const pattern = uniq.map((t) => t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
    return escaped.replace(regex, (m) => `<span class="search-results-hl">${m}</span>`);
  }

  function renderList(list, parent, qTokens) {
    parent.textContent = '';
    if (!list.length) {
      parent.append(createElement('p', { class: 'search-results-empty' }, 'No results.'));
      return;
    }
    const ul = createElement('ul', { class: 'search-results-list' });
    list.forEach((item) => {
      const li = createElement('li', { class: 'search-results-item' });

      const imgWrap = createElement('a', { href: item.path, class: 'search-results-thumb-wrap', 'aria-label': 'Open result' });
      if (item.image) {
        const img = createElement('img', {
          src: item.image,
          alt: '',
          loading: 'lazy',
          class: 'search-results-thumb',
        });
        imgWrap.append(img);
      }

      const title = createElement('a', { href: item.path, class: 'search-results-title' });
      title.innerHTML = highlight(item.title || item.path, qTokens);

      const metaPieces = [];
      const dateStr = formatDate(item.date);
      if (dateStr) metaPieces.push(dateStr);
      if (item.author) metaPieces.push(`by ${item.author}`);
      const meta = createElement('div', { class: 'search-results-meta' }, metaPieces.join(' '));

      const desc = createElement('p', { class: 'search-results-desc' });
      desc.innerHTML = highlight(item.description || '', qTokens);

      const catsLine = Array.isArray(item.tags) && item.tags.length
        ? createElement('div', { class: 'search-results-cats' }, [
          createElement('span', { class: 'label' }, 'Categories: '),
          ...item.tags.map((t, idx) => {
            const prefix = idx ? ', ' : '';
            const href = `/blog?category=${encodeURIComponent(t)}`;
            const link = createElement('a', { href }, t);
            const wrapper = createElement('span', { class: 'search-results-cat' }, [prefix, link]);
            return wrapper;
          }),
        ])
        : '';

      const content = createElement('div', { class: 'search-results-content' }, [title, meta, desc, catsLine].filter(Boolean));

      const arrow = createElement('a', { href: item.path, class: 'search-results-arrow', 'aria-label': 'Open result' });

      const bottom = createElement('div', { class: 'search-results-bottom' }, [
        createElement('button', { class: 'linklike search-results-share', type: 'button' }, 'Share'),
      ]);

      const inner = createElement('div', { class: 'search-results-inner' }, [imgWrap, content, arrow]);

      li.append(inner, bottom);
      ul.append(li);
    });
    parent.append(ul);
  }

  function updateTabsCounts(siteCount, blogCount) {
    const siteTab = tabs.querySelector('#tab-site');
    const blogTab = tabs.querySelector('#tab-blog');
    siteTab.textContent = `Site Search Results (${siteCount})`;
    blogTab.textContent = `Blog Search Results (${blogCount})`;
  }

  function setActiveTab(which) {
    const siteTab = tabs.querySelector('#tab-site');
    const blogTab = tabs.querySelector('#tab-blog');
    const siteActive = which === 'site';
    siteTab.classList.toggle('is-active', siteActive);
    blogTab.classList.toggle('is-active', !siteActive);
    siteTab.setAttribute('aria-selected', siteActive ? 'true' : 'false');
    blogTab.setAttribute('aria-selected', !siteActive ? 'true' : 'false');
    const left = siteActive ? '0%' : '50%';
    indicator.style.left = left;
    sitePanel.classList.toggle('is-active', siteActive);
    blogPanel.classList.toggle('is-active', !siteActive);
  }

  async function runSearch(query) {
    const all = await fetchQueryIndex();
    const qTokens = tokenize(query);
    const prioritized = all
      .map((item) => ({ item, match: classifyMatch(item, qTokens) }))
      .filter((x) => x.match)
      .sort((a, b) => {
        const rank = { title: 0, tagAuthor: 1, description: 2 };
        const ar = rank[a.match];
        const br = rank[b.match];
        if (ar !== br) return ar - br;
        return (b.item.date || 0) - (a.item.date || 0);
      })
      .map((x) => x.item);

    const blog = prioritized.filter((i) => String(i.path).startsWith('/blog'));
    const site = prioritized.filter((i) => !String(i.path).startsWith('/blog'));

    updateTabsCounts(site.length, blog.length);
    resultsInfo.textContent = query ? `${site.length + blog.length} Results Found for "${query}"` : '';

    renderList(site, sitePanel, qTokens);
    renderList(blog, blogPanel, qTokens);
  }

  tabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button[role="tab"]');
    if (!btn) return;
    setActiveTab(btn.id === 'tab-site' ? 'site' : 'blog');
  });

  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = searchForm.querySelector('#search-results-input');
    const q = input.value.trim();
    const url = new URL(window.location.href);
    if (q) {
      url.searchParams.set('q', q);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url.toString());
    runSearch(q);
  });

  // initial state
  indicator.style.left = '0%';

  if (initialQuery) {
    await runSearch(initialQuery);
  } else {
    updateTabsCounts(0, 0);
  }
}
