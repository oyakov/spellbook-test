// src/main.ts
import './style.css';
import type { Settings, DocMeta, DocumentChunk } from './types';
import { authFetch } from './services/api';
import { checkAuthStatus, login, logout } from './services/auth';
import { fetchLibraryTemplates, processLibraryTemplate, deleteLibraryFile } from './services/library';
import { chunkText, embedChunks, getContext } from './utils/rag';
import { extractTextFromPDF } from './utils/pdf';
import { addMessage, addThinkingMessage, removeThinkingMessage } from './components/chat';
import { setupMentions } from './components/mentions';
import { setupSidebar, setupSettingsModal, renderDocItem, updateDocStatus } from './components/ui';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn');
const getCharCount = () => document.querySelector('.char-count');
const attachBtn = document.getElementById('attach-btn');
const docUpload = document.getElementById('doc-upload') as HTMLInputElement;
const documentList = document.getElementById('document-list');
const libraryList = document.getElementById('library-list');
const mentionsDropdown = document.getElementById('mentions-dropdown');
const navItems = document.querySelectorAll('.nav-item');
const settingsBtn = document.querySelector('.header-right .icon-btn:nth-child(2)') as HTMLElement;
const settingsModal = document.getElementById('settings-modal');

// Settings State
let settings: Settings = {
  llmProvider: (localStorage.getItem('llmProvider') as any) || 'gemini',
  embedProvider: (localStorage.getItem('embedProvider') as any) || 'gemini',
  geminiApiKey: localStorage.getItem('geminiApiKey') || ''
};

// Initial state load into UI
if (document.getElementById('llm-provider')) (document.getElementById('llm-provider') as HTMLSelectElement).value = settings.llmProvider;
if (document.getElementById('embed-provider')) (document.getElementById('embed-provider') as HTMLSelectElement).value = settings.embedProvider;
if (document.getElementById('gemini-api-key')) (document.getElementById('gemini-api-key') as HTMLInputElement).value = settings.geminiApiKey;

// RAG State
let vectorStore: DocumentChunk[] = [];
let allDocs: DocMeta[] = [];
(window as any).allDocs = allDocs; // Debugging
let chatHistory: { role: string, text: string }[] = [];
let isAuthenticated = false;

// Initialize Mentions
const mentions = setupMentions(
  chatInput,
  mentionsDropdown!,
  allDocs,
  (doc) => {
    const text = chatInput.value;
    const lastAt = text.lastIndexOf('@');
    chatInput.value = text.substring(0, lastAt) + `@${doc.name} ` + text.substring(chatInput.selectionEnd);
    chatInput.focus();
  }
);

// Auth Initialization
async function initAuth() {
  isAuthenticated = await checkAuthStatus();
  updateAuthUI();
  if (isAuthenticated) {
    loadLibrary();
    const libSection = document.getElementById('library-sidebar-section');
    if (libSection) libSection.style.display = 'flex';
  }
}

function updateAuthUI() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = isAuthenticated ? 'none' : 'flex';
}

// Library Management
async function loadLibrary() {
  if (!libraryList) return;
  libraryList.innerHTML = '';
  const templates = await fetchLibraryTemplates();

  // Filter memory arrays by mutation to maintain references
  const filteredDocs = allDocs.filter(d => !d.source.startsWith('Library: '));
  allDocs.splice(0, allDocs.length, ...filteredDocs);
  
  const filteredChunks = vectorStore.filter(d => !d.source.startsWith('Library: '));
  vectorStore.splice(0, vectorStore.length, ...filteredChunks);

  for (const fileName of templates) {
    const docId = `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    const type = isImage ? 'image' : (fileName === 'Contract_Briefing.txt' ? 'audio' : 'text');
    
    renderDocItem(libraryList, fileName, docId, type, async () => {
      await deleteLibraryFile(fileName);
      loadLibrary();
    });

    const result = await processLibraryTemplate(fileName, docId, settings, (status) => updateDocStatus(docId, status));
    if (result) {
      allDocs.push(result.meta);
      vectorStore.push(...result.chunks);
    }
  }
}

// Send Message
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(chatMessages, text, 'user', allDocs);
  chatInput.value = '';
  chatInput.style.height = 'auto';
  if (getCharCount()) getCharCount()!.textContent = `0/2000`;

  const thinkingId = addThinkingMessage(chatMessages);
  const n8nPrefix = '/n8n ';

  try {
    if (text.startsWith(n8nPrefix)) {
      const n8nMessage = text.substring(n8nPrefix.length).trim();
      const n8nResponse = await authFetch('/api/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: n8nMessage })
      });
      const n8nData = await n8nResponse.json();
      removeThinkingMessage(thinkingId);
      const responseText = typeof n8nData === 'string' ? n8nData : (n8nData.output || n8nData.text || JSON.stringify(n8nData));
      addMessage(chatMessages, `[n8n Automation]: ${responseText}`, 'assistant', allDocs);
      return;
    }

    const currentMentions = allDocs.filter(d => text.includes(`@${d.name}`));
    const searchScope = currentMentions.length > 0 
      ? vectorStore.filter(chunk => currentMentions.some(m => m.name === chunk.source))
      : vectorStore;

    const contextResult = await getContext(text, searchScope, settings);
    const isError = contextResult.startsWith('__ERROR__:');
    const context = isError ? "" : contextResult;

    const mentionContext = currentMentions.map(m => `User explicitly mentioned: ${m.name} (${m.type})`).join('\n');

    const enrichedPrompt = `
Context from RAG:
${context || "No relevant text context found or RAG connection failed."}

Explicitly Mentioned Assets:
${mentionContext || "None"}

User Question: ${text}
`;

    const fetchResponse = await authFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: enrichedPrompt,
        history: chatHistory,
        provider: settings.llmProvider,
        apiKey: settings.geminiApiKey
      })
    });

    const data = await fetchResponse.json();
    if (data.error) throw new Error(data.error);
    
    chatHistory.push({ role: 'user', text: enrichedPrompt });
    chatHistory.push({ role: 'assistant', text: data.text });

    removeThinkingMessage(thinkingId);
    addMessage(chatMessages, data.text, 'assistant', allDocs, data.fallback);

  } catch (error) {
    console.error("Chat Error:", error);
    removeThinkingMessage(thinkingId);
    addMessage(chatMessages, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'assistant', allDocs);
  }
}

// Initial Events
initAuth();
setupSidebar(navItems);
setupSettingsModal(
  settingsBtn, 
  settingsModal, 
  document.getElementById('close-settings'), 
  document.getElementById('save-settings'), 
  (newSettings: Settings) => {
    settings = newSettings;
    localStorage.setItem('llmProvider', settings.llmProvider);
    localStorage.setItem('embedProvider', settings.embedProvider);
    localStorage.setItem('geminiApiKey', settings.geminiApiKey);
    addMessage(chatMessages, "Settings saved successfully.", 'assistant', allDocs);
  }
);

// Drag and Drop Support
const chatInputWrapper = document.querySelector('.chat-input-wrapper');

if (chatInputWrapper) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    chatInputWrapper.addEventListener(eventName, (e: any) => {
      e.preventDefault();
      e.stopPropagation();
    }, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    chatInputWrapper.addEventListener(eventName, () => {
      chatInputWrapper.classList.add('drag-active');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    chatInputWrapper.addEventListener(eventName, () => {
      chatInputWrapper.classList.remove('drag-active');
    }, false);
  });

  chatInputWrapper.addEventListener('drop', (e: any) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
        handleFileUpload(files[0]);
    }
  });
}

async function handleFileUpload(file: File) {
    if (!file) return;

    const docId = `doc-${Date.now()}`;
    if (documentList) renderDocItem(documentList, file.name, docId, file.type === 'application/pdf' ? 'pdf' : 'text');
    updateDocStatus(docId, 'embedding');

    try {
      const text = file.type === 'application/pdf' ? await extractTextFromPDF(file) : await file.text();
      const chunks = chunkText(text);
      const embedded = await embedChunks(chunks, file.name, settings);
      vectorStore.push(...embedded);
      allDocs.push({ id: docId, name: file.name, type: file.type === 'application/pdf' ? 'pdf' : 'text', source: file.name });
      updateDocStatus(docId, 'ready');
    } catch (err) {
      console.error("Upload error", err);
      updateDocStatus(docId, 'error');
    }
}

// File Uploads (Legacy change listener)
if (attachBtn && docUpload) {
  attachBtn.addEventListener('click', () => docUpload.click());
  docUpload.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleFileUpload(file);
  });
}

// Auth UI Events
document.getElementById('login-btn')?.addEventListener('click', async () => {
    const password = (document.getElementById('login-password') as HTMLInputElement).value;
    const loginError = document.getElementById('login-error');
    if (await login(password)) {
        isAuthenticated = true;
        updateAuthUI();
        loadLibrary();
        if (loginError) loginError.style.display = 'none';
    } else {
        if (loginError) {
            loginError.textContent = 'Invalid password';
            loginError.style.display = 'block';
        }
    }
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await logout();
    isAuthenticated = false;
    updateAuthUI();
    vectorStore.splice(0);
    allDocs.splice(0);
    chatHistory.splice(0);
    if (chatMessages) chatMessages.innerHTML = '';
});

// Chat Input Auto-resize
chatInput?.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = `${chatInput.scrollHeight}px`;
    if (getCharCount()) getCharCount()!.textContent = `${chatInput.value.length}/2000`;
});

chatInput?.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || mentions.isMentioning) return;
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

if (sendBtn) sendBtn.addEventListener('click', sendMessage);
document.querySelectorAll('.action-tag').forEach(tag => {
    tag.addEventListener('click', () => {
        const text = tag.textContent?.trim();
        if (text && chatInput) {
            chatInput.value = text;
            chatInput.dispatchEvent(new Event('input'));
            chatInput.focus();
        }
    });
});

// Global Listeners
window.addEventListener('unauthorized', () => {
    isAuthenticated = false;
    updateAuthUI();
});
