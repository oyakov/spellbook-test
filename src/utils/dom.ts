// src/utils/dom.ts

export const $ = (selector: string) => document.querySelector(selector) as HTMLElement;
export const $$ = (selector: string) => document.querySelectorAll(selector);

export function scrollToBottom(el: HTMLElement | null) {
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}
