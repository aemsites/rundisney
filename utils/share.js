import { createElement, createIcon } from './dom.js';

/**
 * Creates a share button with tooltip containing social media sharing options
 * @param {Object} options - Configuration options
 * @param {string} options.url - URL to share (defaults to current page URL)
 * @param {string} options.title - Title to share (defaults to document title)
 * @param {string} options.description - Description to share (defaults to meta description)
 * @param {string} options.className - Additional CSS class for the share button
 * @returns {HTMLElement} The share button element
 */
const createShareButton = (options = {}) => {
  const {
    url = window.location.href,
    title = document.title,
    description = document.querySelector('meta[name="description"]')?.content || '',
    className = 'share-button',
  } = options;

  const shareButton = createElement('a', {
    class: className,
    'aria-label': 'Share this post',
    'aria-expanded': 'false',
    role: 'button',
    tabindex: '0',
  }, [
    createElement('h5', {}, 'Share'),
    createIcon('share', 's'),
    createElement('div', { class: ['share-tooltip', 'tooltip'] }, [
      createElement('a', {
        href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`,
        target: '_blank',
        'aria-label': 'Share on Pinterest',
      }, [
        createIcon('pinterest', 's'),
        createElement('span', {}, 'Pinterest'),
      ]),
      createElement('a', {
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        target: '_blank',
        'aria-label': 'Share on Facebook',
      }, [
        createIcon('facebook', 's'),
        createElement('span', {}, 'Facebook'),
      ]),
      createElement('a', {
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        target: '_blank',
        'aria-label': 'Share on Twitter',
      }, [
        createIcon('twitter', 's'),
        createElement('span', {}, 'Twitter'),
      ]),
      createElement('a', {
        href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this blog post: ${url}`)}`,
        'aria-label': 'Share via Email',
      }, [
        createIcon('email', 's'),
        createElement('span', {}, 'Email'),
      ]),
    ]),
  ]);

  shareButton.addEventListener('click', (e) => {
    if (e.target.closest('.share-tooltip a')) {
      return;
    }

    e.preventDefault();
    const tooltip = shareButton.querySelector('.share-tooltip');
    const isExpanded = shareButton.getAttribute('aria-expanded') === 'true';

    tooltip.classList.toggle('visible');
    shareButton.setAttribute('aria-expanded', !isExpanded);
  });

  return shareButton;
};

export default createShareButton;
