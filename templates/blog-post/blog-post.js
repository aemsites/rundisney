import { getMetadata } from '../../scripts/aem.js';
import { createElement, createIcon } from '../../utils/dom.js';

export default function decorateBlogPostTemplate() {
  const author = getMetadata('author');
  const date = getMetadata('date');
  const main = document.querySelector('main');
  const hero = main.querySelector('.section:first-of-type');

  const blogPostInfo = createElement('div', { class: 'blog-post-info' }, [
    createElement('div', { class: 'stay-connected' }, [
      createElement('div', { class: 'social-media' }, [
        createElement('h3', {}, 'Stay Connected'),
        createElement('div', { class: 'social-icons' }, [
          createElement('a', { href: 'https://www.facebook.com/RunDisney/', target: '_blank' }, createIcon('facebook')),
          createElement('a', { href: 'https://www.instagram.com/rundisney/', target: '_blank' }, createIcon('instagram')),
          createElement('a', { href: 'https://www.youtube.com/user/runDisney', target: '_blank' }, createIcon('youtube')),
        ]),
      ]),
      createElement('div', { class: 'Share' }, [
        createElement('button', { class: 'share-button' }, [
          createIcon('share'),
          createElement('span', {}, 'Share'),
        ]),
      ]),
    ]),
    createElement('div', { class: 'blog-metadata' }, [
      createElement('div', { class: 'author' }, [
        createIcon('characters', 'xxl'),
        createElement('span', {}, `by ${author}`),
      ]),
      createElement('div', { class: 'date' }, [
        createIcon('calendar-month', 'l'),
        createElement('span', {}, date),
      ]),
    ]),
  ]);

  const postCategoriesWrapper = main.querySelector('.post-categories-wrapper');
  const tags = getMetadata('article:tag');

  if (postCategoriesWrapper) {
    const categoriesElement = createElement('div', { class: 'post-categories' }, [
      createElement('span', { class: 'categories-label' }, 'Categories:'),
      createElement('span', {}, tags),
    ]);

    postCategoriesWrapper.append(categoriesElement);
  }

  hero.append(blogPostInfo);
}
