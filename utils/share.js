import { createElement, createIcon } from './dom.js';

function showMobileShareModal(url, title, description) {
  const modal = createElement('div', { class: 'mobile-share-modal' });

  const modalContent = createElement('div', { class: 'mobile-share-modal-content' }, [
    createElement('div', { class: 'mobile-share-header' }, [
      createElement('h3', {}, 'Share'),
      createElement('button', {
        class: 'mobile-share-close',
        'aria-label': 'Close share modal',
      }, createIcon('close-reversed', 's')),
    ]),
    createElement('div', { class: 'mobile-share-buttons' }, [
      createElement('a', {
        href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`,
        target: '_blank',
        class: 'mobile-share-button',
        'aria-label': 'Share on Pinterest',
      }, [
        createIcon('pinterest', 'l'),
        createElement('span', {}, 'Pinterest'),
      ]),
      createElement('a', {
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        target: '_blank',
        class: 'mobile-share-button',
        'aria-label': 'Share on Facebook',
      }, [
        createIcon('facebook', 'l'),
        createElement('span', {}, 'Facebook'),
      ]),
      createElement('a', {
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        target: '_blank',
        class: 'mobile-share-button',
        'aria-label': 'Share on Twitter',
      }, [
        createIcon('twitter', 'l'),
        createElement('span', {}, 'Twitter'),
      ]),
      createElement('a', {
        href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Check out this blog post: ${url}`)}`,
        class: 'mobile-share-button',
        'aria-label': 'Share via Email',
      }, [
        createIcon('email', 'l'),
        createElement('span', {}, 'Email'),
      ]),
    ]),
  ]);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  const closeButton = modal.querySelector('.mobile-share-close');
  const closeModal = () => {
    modal.remove();
    document.body.style.overflow = '';
  };

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.body.style.overflow = 'hidden';
  closeButton.focus();
}

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
    createElement('p', {}, 'Share'),
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

    const isMobile = window.matchMedia('(max-width: 1023px)').matches;

    if (isMobile) {
      showMobileShareModal(url, title, description);
    } else {
      const tooltip = shareButton.querySelector('.share-tooltip');
      const isExpanded = shareButton.getAttribute('aria-expanded') === 'true';

      tooltip.classList.toggle('visible');
      shareButton.setAttribute('aria-expanded', !isExpanded);
    }
  });

  return shareButton;
};

export default createShareButton;
