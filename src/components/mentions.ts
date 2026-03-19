// src/components/mentions.ts
import type { DocMeta } from '../types';

export function setupMentions(
  chatInput: HTMLTextAreaElement,
  mentionsDropdown: HTMLElement,
  allDocs: DocMeta[],
  onSelect: (doc: DocMeta) => void
) {
  let isMentioning = false;
  let mentionQuery = '';
  let selectedMentionIndex = 0;

  function updateMentionsDropdown() {
    if (!isMentioning) {
      mentionsDropdown.style.display = 'none';
      return;
    }

    const filtered = allDocs.filter(d =>
      d.name.toLowerCase().includes(mentionQuery.toLowerCase())
    );

    if (filtered.length === 0) {
      mentionsDropdown.style.display = 'none';
      return;
    }

    mentionsDropdown.style.display = 'flex';
    mentionsDropdown.innerHTML = '';

    filtered.forEach((doc, index) => {
      const item = document.createElement('div');
      item.className = `mention-item ${index === selectedMentionIndex ? 'selected' : ''}`;
      const icon = doc.type === 'pdf' ? '📄' : doc.type === 'image' ? '🖼️' : doc.type === 'audio' ? '🔊' : '📚';
      item.innerHTML = `<span class="icon">${icon}</span><span class="name">${doc.name}</span>`;
      item.addEventListener('click', () => {
        onSelect(doc);
        isMentioning = false;
        updateMentionsDropdown();
      });
      mentionsDropdown.appendChild(item);
    });
  }

  chatInput.addEventListener('input', () => {
    const text = chatInput.value;
    const caretPos = chatInput.selectionStart;
    const textBeforeCaret = text.substring(0, caretPos);
    
    // Find last '@' that is either at start or after a space
    const matches = Array.from(textBeforeCaret.matchAll(/(^|\s)@/g));
    const lastMatch = matches.length > 0 ? matches[matches.length - 1] : null;
    const lastAt = lastMatch ? (lastMatch.index! + lastMatch[1].length) : -1;

    if (lastAt !== -1) {
      isMentioning = true;
      mentionQuery = textBeforeCaret.substring(lastAt + 1);
      selectedMentionIndex = 0;
    } else {
      isMentioning = false;
    }
    updateMentionsDropdown();
  });

  chatInput.addEventListener('keydown', (e) => {
    if (isMentioning && mentionsDropdown.style.display !== 'none') {
      const filtered = allDocs.filter(d => d.name.toLowerCase().includes(mentionQuery.toLowerCase()));
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedMentionIndex = (selectedMentionIndex + 1) % filtered.length;
        updateMentionsDropdown();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedMentionIndex = (selectedMentionIndex - 1 + filtered.length) % filtered.length;
        updateMentionsDropdown();
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (filtered[selectedMentionIndex]) {
          e.preventDefault();
          onSelect(filtered[selectedMentionIndex]);
          isMentioning = false;
          updateMentionsDropdown();
        }
      } else if (e.key === 'Escape') {
        isMentioning = false;
        updateMentionsDropdown();
      }
    }
  });

  return { 
    get isMentioning() { return isMentioning && mentionsDropdown.style.display !== 'none'; },
    cancel: () => { isMentioning = false; updateMentionsDropdown(); }
  };
}
