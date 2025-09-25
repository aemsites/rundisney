import { createElement } from '../../utils/dom.js';
import createShareButton from '../../utils/share.js';

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const link = block.querySelector('a[href]');
  const videoUrl = link?.href;
  if (!videoUrl) return;

  block.textContent = '';
  const posterUrl = videoUrl.replace('Video.mp4', 'Thumbnail.png');
  const wrapper = createElement('div', { class: 'video-wrapper' });
  const videoEl = createElement('video', {
    src: videoUrl,
    controls: '',
    playsinline: '',
    preload: 'metadata',
    ...(posterUrl ? { poster: posterUrl } : {}),
  });

  const shareBtn = createShareButton();
  shareBtn.classList.add('video-share');

  wrapper.append(videoEl, shareBtn);
  block.append(wrapper);
}
