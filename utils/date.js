/**
 * Format epoch seconds to a readable date string
 * @param {number} epochSeconds - Unix timestamp in seconds
 * @returns {string} Formatted date string or empty string if invalid
 */

// eslint-disable-next-line import/prefer-default-export
export function formatDate(epochSeconds) {
  if (!epochSeconds || epochSeconds < 1000000000) return '';
  try {
    const d = new Date(epochSeconds * 1000);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch (e) {
    return '';
  }
}
