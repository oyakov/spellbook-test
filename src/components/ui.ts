import type { Settings } from '../types';

export function setupSidebar(navItems: NodeListOf<Element>) {
  const docsSidebarSection = document.getElementById('docs-sidebar-section');
  const librarySidebarSection = document.getElementById('library-sidebar-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e: Event) => {
      e.preventDefault();
      const currentItem = e.currentTarget as HTMLElement;
      console.log("Tab clicked:", currentItem.id);

      navItems.forEach(n => n.classList.remove('active'));
      currentItem.classList.add('active');

      if (currentItem.id === 'nav-docs') {
        if (docsSidebarSection) docsSidebarSection.style.display = 'flex';
        if (librarySidebarSection) librarySidebarSection.style.display = 'none';
      } else if (currentItem.id === 'nav-library') {
        if (librarySidebarSection) librarySidebarSection.style.display = 'flex';
        if (docsSidebarSection) docsSidebarSection.style.display = 'none';
      } else if (currentItem.id === 'nav-chat') {
        // By default, show library templates while chatting
        if (librarySidebarSection) librarySidebarSection.style.display = 'flex';
        if (docsSidebarSection) docsSidebarSection.style.display = 'none';
      }
    });
  });
}

export function setupSettingsModal(
  settingsBtn: HTMLElement | null,
  settingsModal: HTMLElement | null,
  closeSettingsBtn: HTMLElement | null,
  saveSettingsBtn: HTMLElement | null,
  onSave: (newSettings: Settings) => void
) {
  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'flex';
    });
  }

  if (closeSettingsBtn && settingsModal) {
    closeSettingsBtn.addEventListener('click', () => {
      settingsModal.style.display = 'none';
    });
  }

  if (saveSettingsBtn && settingsModal) {
    saveSettingsBtn.addEventListener('click', () => {
      onSave({
        llmProvider: (document.getElementById('llm-provider') as HTMLSelectElement).value as any,
        embedProvider: (document.getElementById('embed-provider') as HTMLSelectElement).value as any,
        geminiApiKey: (document.getElementById('gemini-api-key') as HTMLInputElement).value
      });
      settingsModal.style.display = 'none';
    });
  }
}

export function renderDocItem(list: HTMLElement | null, name: string, id: string, type: string, onDelete?: () => void) {
  if (!list) return;
  if (list.querySelector('.empty-docs')) list.innerHTML = '';
  
  const div = document.createElement('div');
  div.className = `document-item ${onDelete ? 'library-item' : 'doc-item'}`;
  div.id = id;
  const icon = type === 'image' ? '🖼️' : type === 'audio' ? '🔊' : (type === 'pdf' ? '📄' : '📚');
  
  div.innerHTML = `
    <span class="doc-icon">${icon}</span>
    <span class="doc-info" style="flex: 1;">${name.replace(/_/g, ' ')}</span>
    <span class="doc-status embedding"></span>
    ${onDelete ? `<button class="delete-lib-btn icon-btn" style="width: 20px; height: 20px; font-size: 10px; padding: 0; color: #ef4444; border: none; background: transparent; cursor: pointer;">❌</button>` : ''}
  `;

  if (onDelete) {
    const deleteBtn = div.querySelector('.delete-lib-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete();
      });
    }
  }

  list.appendChild(div);
}

export function updateDocStatus(id: string, status: 'embedding' | 'ready' | 'error') {
  const el = document.getElementById(id)?.querySelector('.doc-status');
  if (el) {
    el.className = `doc-status ${status}`;
  }
}
