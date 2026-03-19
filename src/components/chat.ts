// src/components/chat.ts
import type { DocMeta } from '../types';
import { scrollToBottom } from '../utils/dom';

export function formatMessage(text: string, allDocs: DocMeta[]): string {
  // 1. Markdown Formatting
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');

  // 2. Convert [doc:Name] or @Name to links
  formatted = formatted.replace(/\[doc:([^\]]+)\]/g, (_, name) => {
    return `<a href="#" class="message-link" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('mention-click', {detail: '${name}'}))">${name}</a>`;
  });

  // Handle @mentions
  [...allDocs].sort((a, b) => b.name.length - a.name.length).forEach(doc => {
    const escapedName = doc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentionRegex = new RegExp(`@${escapedName}\\b`, 'g');
    formatted = formatted.replace(mentionRegex, `<a href="#" class="message-link" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('mention-click', {detail: '${doc.name}'}))">${doc.name}</a>`);
  });

  return formatted;
}

export function addMessage(
  chatMessages: HTMLElement | null,
  text: string,
  sender: 'user' | 'assistant',
  allDocs: DocMeta[],
  isFallback = false
) {
  if (!chatMessages) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  const formattedContent = formatMessage(text, allDocs);

  messageDiv.innerHTML = `
        <div class="message-container" style="display: flex; flex-direction: column; width: 100%;">
            <div class="message-content response-text">
                ${formattedContent}
            </div>
            ${isFallback ? `
                <div class="fallback-badge" role="alert" aria-live="polite">
                    <span>⚠️</span>
                    <span>Local LLM unavailable, using Gemini fallback</span>
                </div>
            ` : ''}
        </div>
    `;
  chatMessages.appendChild(messageDiv);
  scrollToBottom(chatMessages);
}

export function addThinkingMessage(chatMessages: HTMLElement | null): string {
  if (!chatMessages) return '';
  const id = `thinking-${Date.now()}`;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message assistant`;
  messageDiv.id = id;
  messageDiv.innerHTML = `
        <div class="message-content">
            <div class="thinking">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
    `;
  chatMessages.appendChild(messageDiv);
  scrollToBottom(chatMessages);
  return id;
}

export function removeThinkingMessage(id: string) {
  const el = document.getElementById(id);
  if (el) el.remove();
}
