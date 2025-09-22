import { getMetadata } from '../../scripts/aem.js';
import { createElement, createIcon } from '../../utils/dom.js';
import { formatCategoryLabel, navigateToBlogWithParams } from '../../blocks/blog-filter/blog-filter.js';

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
      createElement('div', { class: 'share' }, [
        createElement('a', {
          class: 'share-button',
          'aria-label': 'Share this post',
          'aria-expanded': 'false',
          role: 'button',
          tabindex: '0',
        }, [
          createElement('h5', {}, 'Share'),
          createIcon('share', 's'),
          createElement('div', { class: ['share-tooltip', 'tooltip'] }, [
            createElement('a', { href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&description=${encodeURIComponent(document.title)}`, target: '_blank', 'aria-label': 'Share on Pinterest' }, [
              createIcon('pinterest', 's'),
              createElement('span', {}, 'Pinterest'),
            ]),
            createElement('a', { href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, target: '_blank', 'aria-label': 'Share on Facebook' }, [
              createIcon('facebook', 's'),
              createElement('span', {}, 'Facebook'),
            ]),
            createElement('a', { href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(document.title)}`, target: '_blank', 'aria-label': 'Share on Twitter' }, [
              createIcon('twitter', 's'),
              createElement('span', {}, 'Twitter'),
            ]),
            createElement('a', { href: `mailto:?subject=${encodeURIComponent(document.title)}&body=${encodeURIComponent(`Check out this blog post: ${window.location.href}`)}`, 'aria-label': 'Share via Email' }, [
              createIcon('email', 's'),
              createElement('span', {}, 'Email'),
            ]),
          ]),
        ]),
      ]),
    ]),
    createElement('div', { class: 'blog-metadata' }, [
      createElement('div', { class: 'author' }, [
        createIcon('characters', 'l'),
        createElement('span', {}, `by ${author}`),
      ]),
      createElement('div', { class: 'date' }, [
        createElement('span', {}, date),
      ]),
    ]),
  ]);

  const shareButton = blogPostInfo.querySelector('.share-button');
  shareButton.addEventListener('click', () => {
    shareButton.querySelector('.share-tooltip').classList.toggle('visible');
    shareButton.setAttribute('aria-expanded', shareButton.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
  });

  const featuredBlogsWrapper = main.querySelector('.featured-blogs-container');
  const tags = getMetadata('article:tag');
  const postTags = tags.split(',').map((tag) => tag.trim());

  if (featuredBlogsWrapper) {
    const categoriesElement = createElement('div', { class: 'post-categories' }, [
      createElement('span', { class: 'categories-label' }, 'Categories:'),
      createElement('div', {}, postTags.map((tag, index) => {
        const displayName = formatCategoryLabel(tag);
        const tagLink = createElement('a', {
          href: '#',
          title: `View all posts in ${displayName}`,
        }, displayName);

        tagLink.addEventListener('click', (e) => {
          e.preventDefault();
          navigateToBlogWithParams([tag], []);
        });

        if (index < postTags.length - 1) {
          return [tagLink, createElement('span', {}, ', ')];
        }

        return tagLink;
      }).flat()),
    ]);

    featuredBlogsWrapper.before(categoriesElement);
  }

  hero.append(blogPostInfo);
  hero.prepend(createElement('div', { class: 'blog-post-title' }, createElement('a', { href: '/blog' }, [createElement('em', {}, 'run'), 'Disney Blog'])));
}
