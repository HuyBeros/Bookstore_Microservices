export const OPEN_BOOK_CHAT = 'bookstore:open-chat';

export function openBookChat(trigger) {
  window.dispatchEvent(new CustomEvent(OPEN_BOOK_CHAT, { detail: { trigger } }));
}
