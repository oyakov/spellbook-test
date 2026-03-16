import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn');
const charCount = document.querySelector('.char-count');
const attachBtn = document.getElementById('attach-btn');
const docUpload = document.getElementById('doc-upload') as HTMLInputElement;
const documentList = document.getElementById('document-list');
const libraryList = document.getElementById('library-list');
const mentionsDropdown = document.getElementById('mentions-dropdown');
const docsSidebarSection = document.getElementById('docs-sidebar-section');
const librarySidebarSection = document.getElementById('library-sidebar-section');
const navItems = document.querySelectorAll('.nav-item');
const settingsBtn = document.querySelector('.header-right .icon-btn:nth-child(2)'); // Gear icon
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const saveSettingsBtn = document.getElementById('save-settings');
const llmProviderSelect = document.getElementById('llm-provider') as HTMLSelectElement;
const embedProviderSelect = document.getElementById('embed-provider') as HTMLSelectElement;
const geminiApiKeyInput = document.getElementById('gemini-api-key') as HTMLInputElement;
const loginOverlay = document.getElementById('login-overlay');
const loginPasswordInput = document.getElementById('login-password') as HTMLInputElement;
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

// Settings State
interface Settings {
  llmProvider: 'gemini' | 'lmstudio';
  embedProvider: 'gemini' | 'lmstudio';
  geminiApiKey: string;
}

let settings: Settings = {
  llmProvider: (localStorage.getItem('llmProvider') as any) || 'gemini',
  embedProvider: (localStorage.getItem('embedProvider') as any) || 'gemini',
  geminiApiKey: localStorage.getItem('geminiApiKey') || ''
};

// Update UI with initial settings
if (llmProviderSelect) llmProviderSelect.value = settings.llmProvider;
if (embedProviderSelect) embedProviderSelect.value = settings.embedProvider;
if (geminiApiKeyInput) geminiApiKeyInput.value = settings.geminiApiKey;

// RAG State
interface DocumentChunk {
  text: string;
  embedding: number[];
  source: string;
}

interface DocMeta {
  id: string;
  name: string;
  type: 'text' | 'image' | 'audio' | 'pdf';
  source: string;
}

let vectorStore: DocumentChunk[] = [];
let allDocs: DocMeta[] = [];

// Auth State
let isAuthenticated = false;

async function checkAuth() {
  try {
    const res = await fetch('/api/user');
    const data = await res.json();
    isAuthenticated = data.authenticated;
    updateAuthUI();
    if (isAuthenticated) {
      loadLibraryDocuments();
    }
  } catch (err) {
    console.error("Auth check failed", err);
  }
}

function updateAuthUI() {
  if (loginOverlay) {
    loginOverlay.style.display = isAuthenticated ? 'none' : 'flex';
  }
}

async function handleLogin() {
  const password = loginPasswordInput?.value;
  if (!password) return;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      isAuthenticated = true;
      if (loginError) loginError.style.display = 'none';
      if (loginPasswordInput) loginPasswordInput.value = '';
      updateAuthUI();
      loadLibraryDocuments(); // Initial load after auth
    } else {
      if (loginError) loginError.style.display = 'block';
    }
  } catch (err) {
    console.error("Login failed", err);
  }
}

async function handleLogout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    isAuthenticated = false;
    updateAuthUI();
    // Clear state
    vectorStore = [];
    allDocs = [];
    chatHistory = [];
    if (chatMessages) chatMessages.innerHTML = '';
  } catch (err) {
    console.error("Logout failed", err);
  }
}

if (loginBtn) loginBtn.addEventListener('click', handleLogin);
if (loginPasswordInput) {
  loginPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
}
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

// Helper for authenticated fetches
async function authFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    isAuthenticated = false;
    updateAuthUI();
    throw new Error('Unauthorized');
  }
  return res;
}

// Chat History
let chatHistory: { role: string, text: string }[] = [];

// Mention Logic
let mentionQuery = '';
let isMentioning = false;
let selectedMentionIndex = 0;

function updateMentionsDropdown() {
  if (!mentionsDropdown) return;
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
    item.addEventListener('click', () => selectMention(doc));
    mentionsDropdown.appendChild(item);
  });
}

function selectMention(doc: DocMeta) {
  const text = chatInput.value;
  const lastAt = text.lastIndexOf('@');
  const newText = text.substring(0, lastAt) + `@${doc.name} ` + text.substring(chatInput.selectionEnd);
  chatInput.value = newText;
  isMentioning = false;
  updateMentionsDropdown();
  chatInput.focus();
}

// Event Listeners
if (chatInput) {
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = `${chatInput.scrollHeight}px`;

    // Mention detection
    const text = chatInput.value;
    const caretPos = chatInput.selectionStart;
    const textBeforeCaret = text.substring(0, caretPos);
    const lastAt = textBeforeCaret.lastIndexOf('@');

    if (lastAt !== -1 && !textBeforeCaret.substring(lastAt).includes(' ')) {
      isMentioning = true;
      mentionQuery = textBeforeCaret.substring(lastAt + 1);
      selectedMentionIndex = 0;
    } else {
      isMentioning = false;
    }
    updateMentionsDropdown();

    if (charCount) {
      charCount.textContent = `${chatInput.value.length}/2000`;
    }
  });

  chatInput.addEventListener('keydown', (e) => {
    if (isMentioning && mentionsDropdown?.style.display !== 'none') {
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
        e.preventDefault();
        if (filtered[selectedMentionIndex]) selectMention(filtered[selectedMentionIndex]);
      } else if (e.key === 'Escape') {
        isMentioning = false;
        updateMentionsDropdown();
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// Settings Modal Logic
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
    settings.llmProvider = llmProviderSelect.value as any;
    settings.embedProvider = embedProviderSelect.value as any;
    settings.geminiApiKey = geminiApiKeyInput.value;

    localStorage.setItem('llmProvider', settings.llmProvider);
    localStorage.setItem('embedProvider', settings.embedProvider);
    localStorage.setItem('geminiApiKey', settings.geminiApiKey);

    settingsModal.style.display = 'none';
    addMessage("Settings saved successfully.", 'assistant');
  });
}

if (sendBtn) {
  sendBtn.addEventListener('click', sendMessage);
}

if (attachBtn && docUpload) {
  attachBtn.addEventListener('click', () => docUpload.click());
  docUpload.addEventListener('change', handleFileUpload);
}

const libraryUpload = document.getElementById('library-upload') as HTMLInputElement;
if (libraryUpload) {
  libraryUpload.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const res = await authFetch('/api/library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64 })
        });
        if (res.ok) {
           await loadLibraryDocuments(); // Refresh library
        }
      };
      reader.readAsDataURL(file);
    } catch(err) {
      console.error("Library upload error", err);
    }
  });
}

// Action Tags
document.querySelectorAll('.action-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    if (chatInput) {
      chatInput.value = tag.textContent || '';
      chatInput.dispatchEvent(new Event('input'));
      chatInput.focus();
    }
  });
});

// Sidebar Navigation
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

// Library Logic
async function loadLibraryDocuments() {
  if (libraryList) {
    libraryList.innerHTML = '';
  }

  let templates: string[] = [];
  try {
    const res = await authFetch('/api/library');
    if (res.ok) {
      templates = await res.json();
    }
  } catch (err) {
    console.error("Failed to load library templates from server", err);
  }

  // Clear existing library docs from memory so we don't duplicate on reload
  allDocs = allDocs.filter(d => !d.source.startsWith('Library: '));
  vectorStore = vectorStore.filter(d => !d.source.startsWith('Library: '));

  for (const fileName of templates) {
    const docId = `lib-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
    const isAudio = fileName === 'Contract_Briefing.txt'; // Simulated audio
    const type = isImage ? 'image' : isAudio ? 'audio' : 'text';

    addLibraryDocToUI(fileName, docId, type);

    try {
      const response = await authFetch(`/library/${fileName}`);
      if (isImage) {
        const name = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
        allDocs.push({ id: docId, name, type: 'image', source: `Library: ${fileName}` });
        updateLibraryDocStatus(docId, 'ready');
      } else {
        const text = await response.text();
        const chunks = chunkText(text);
        const embeddedChunks = await embedChunks(chunks, `Library: ${fileName}`);
        vectorStore.push(...embeddedChunks);

        const name = fileName.split('.')[0].replace(/_/g, ' ');
        allDocs.push({ id: docId, name, type: isAudio ? 'audio' : 'text', source: `Library: ${fileName}` });
        updateLibraryDocStatus(docId, 'ready');
      }
    } catch (error) {
      console.error(`Failed to load library doc ${fileName}:`, error);
      updateLibraryDocStatus(docId, 'error');
    }
  }
}

function addLibraryDocToUI(sourceFileName: string, id: string, type: 'text' | 'image' | 'audio' | 'pdf' = 'text') {
  const div = document.createElement('div');
  div.className = 'document-item library-item';
  div.id = id;
  const icon = type === 'image' ? '🖼️' : type === 'audio' ? '🔊' : '📚';
  
  div.innerHTML = `
    <span class="doc-icon">${icon}</span>
    <span class="doc-info" style="flex: 1;">${sourceFileName.split('.')[0].replace(/_/g, ' ')}</span>
    <span class="doc-status embedding"></span>
    <button class="delete-lib-btn icon-btn" style="width: 20px; height: 20px; font-size: 10px; padding: 0; color: #ef4444; border: none; background: transparent; cursor: pointer;">❌</button>
  `;

  // Click handler for chatting
  div.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.delete-lib-btn')) return;
    if(chatInput) {
      chatInput.value = `Can you summarize the ${sourceFileName.split('.')[0]} template for me?`;
      sendMessage();
    }
  });

  // Delete handler
  const deleteBtn = div.querySelector('.delete-lib-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const res = await authFetch(`/api/library/${encodeURIComponent(sourceFileName)}`, { method: 'DELETE' });
        if (res.ok) {
          loadLibraryDocuments(); // Reload library from server
        }
      } catch (err) {
        console.error("Failed to delete library document", err);
      }
    });
  }

  libraryList?.appendChild(div);
}

function updateLibraryDocStatus(id: string, status: 'embedding' | 'ready' | 'error') {
  const el = document.getElementById(id)?.querySelector('.doc-status');
  if (el) {
    el.className = `doc-status ${status}`;
  }
}

// Initial Load
checkAuth();
if (librarySidebarSection) librarySidebarSection.style.display = 'flex';

// RAG Logic
async function handleFileUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const docId = `doc-${Date.now()}`;
  addDocToUI(file.name, docId);

  try {
    updateDocStatus(docId, 'embedding');
    let text = '';

    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else {
      text = await file.text();
    }

    const chunks = chunkText(text);
    const embeddedChunks = await embedChunks(chunks, file.name);
    vectorStore.push(...embeddedChunks);

    allDocs.push({
      id: docId,
      name: file.name,
      type: file.type === 'application/pdf' ? 'pdf' : 'text',
      source: file.name
    });

    updateDocStatus(docId, 'ready');
  } catch (error) {
    console.error("RAG Error:", error);
    updateDocStatus(docId, 'error');
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return fullText;
}

function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = start + size;
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}

async function embedChunks(chunks: string[], source: string): Promise<DocumentChunk[]> {
  const embedded: DocumentChunk[] = [];
  for (const chunk of chunks) {
    try {
      const response = await authFetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: chunk,
          provider: settings.embedProvider,
          apiKey: settings.geminiApiKey
        })
      });
      const data = await response.json();
      embedded.push({
        text: chunk,
        embedding: data.data[0].embedding,
        source
      });
    } catch (e) {
      console.warn("Embedding failed for chunk, skipping...", e);
    }
  }
  return embedded;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(mA) * Math.sqrt(mB));
}

async function getContext(query: string, topK = 3): Promise<string> {
  if (vectorStore.length === 0) return "";

  try {
    let response;
    let lastError;

    try {
      response = await authFetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          input: query,
          provider: settings.embedProvider,
          apiKey: settings.geminiApiKey
        })
      });
    } catch (err) {
      lastError = err;
      console.warn(`Failed to connect to /api/embed:`, err);
    }

    if (!response || !response.ok) {
      if (response) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Status: ${response.status}`);
      }
      throw lastError || new Error(`Failed to connect`);
    }

    const data = await response.json();
    if (!data.data || !data.data[0]) throw new Error("Invalid response format from embed proxy");
    const queryEmbedding = data.data[0].embedding;

    const similarities = vectorStore.map(chunk => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, topK).map(s => s.chunk.text).join('\n---\n');
  } catch (e) {
    console.error("RAG Context retrieval failed:", e);
    // Log the error to the chat for the user to see diagnostics
    return `__ERROR__: ${e instanceof Error ? e.message : 'Unknown connection error'}`;
  }
}

function formatMessage(text: string): string {
  // Regex to find [doc:Name] or @Name and convert to links
  let formatted = text.replace(/\[doc:([^\]]+)\]/g, (_, name) => {
    return `<a href="#" class="message-link" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('mention-click', {detail: '${name}'}))">${name}</a>`;
  });

  // Handle @mentions, sorting by length descending to match longer names first
  [...allDocs].sort((a, b) => b.name.length - a.name.length).forEach(doc => {
    // Escape doc.name for regex use in case it has special characters
    const escapedName = doc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const mentionRegex = new RegExp(`@${escapedName}\\b`, 'g');
    formatted = formatted.replace(mentionRegex, `<a href="#" class="message-link" onclick="event.preventDefault(); window.dispatchEvent(new CustomEvent('mention-click', {detail: '${doc.name}'}))">${doc.name}</a>`);
  });

  return formatted;
}

// Global listener for mention clicks (could be used for previews)
window.addEventListener('mention-click', ((e: CustomEvent) => {
  console.log("Mention clicked:", e.detail);
}) as any);

// Chat functions
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, 'user');
  chatInput.value = '';
  chatInput.style.height = 'auto';
  if (charCount) charCount.textContent = `0/2000`;

  const thinkingId = addThinkingMessage();
  const n8nPrefix = '/n8n ';

  try {
    if (text.startsWith(n8nPrefix)) {
      const n8nMessage = text.substring(n8nPrefix.length).trim();
      const n8nResponse = await authFetch('/api/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: n8nMessage })
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n bridge returned ${n8nResponse.status}`);
      }
      const n8nData = await n8nResponse.json();
      removeThinkingMessage(thinkingId);

      // Assume n8n returns { output: "..." } or similar, or just stringify it
      const responseText = typeof n8nData === 'string' ? n8nData : (n8nData.output || n8nData.text || JSON.stringify(n8nData));
      addMessage(`[n8n Automation]: ${responseText}`, 'assistant');
      return;
    }

    const contextResult = await getContext(text);
    const isError = contextResult.startsWith('__ERROR__:');
    const context = isError ? "" : contextResult;

    if (isError) {
      console.warn("Continuing Gemini call without RAG context due to:", contextResult);
    }

    // Find all @mentions in the text
    const mentions = allDocs.filter(d => text.includes(`@${d.name}`));
    const mentionContext = mentions.map(m => `User explicitly mentioned: ${m.name} (${m.type})`).join('\n');

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

    if (!fetchResponse.ok) {
      const errData = await fetchResponse.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned ${fetchResponse.status}`);
    }
    const data = await fetchResponse.json().catch(() => ({}));
    if (data.error) {
      throw new Error(data.error);
    }
    const responseText = data.text;
    const fallback = data.fallback === true;

    chatHistory.push({ role: 'user', text: enrichedPrompt });
    chatHistory.push({ role: 'assistant', text: responseText });

    removeThinkingMessage(thinkingId);
    addMessage(responseText, 'assistant', fallback);
  } catch (error) {
    console.error("Chat Error:", error);
    removeThinkingMessage(thinkingId);

    let errorMsg = "I apologize, but I encountered an error.";
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        errorMsg += " It seems the Gemini API Key is missing or invalid.";
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMsg += " There was a network issue communicating with the AI services.";
      } else {
        errorMsg += ` Details: ${error.message}`;
      }
    }

    addMessage(errorMsg + "\n\n💡 **Tip:** Check the browser console (F12) for detailed logs. If RAG is the issue, ensure LM Studio has CORS enabled in Server Settings.", 'assistant');
  }
}

// UI Helpers
function addDocToUI(name: string, id: string) {
  if (documentList?.querySelector('.empty-docs')) {
    documentList.innerHTML = '';
  }
  const div = document.createElement('div');
  div.className = 'doc-item';
  div.id = id;
  div.innerHTML = `
    <span class="doc-icon">📄</span>
    <span class="doc-info">${name}</span>
    <span class="doc-status ready"></span>
  `;
  documentList?.appendChild(div);
}

function updateDocStatus(id: string, status: 'embedding' | 'ready' | 'error') {
  const el = document.getElementById(id)?.querySelector('.doc-status');
  if (el) {
    el.className = `doc-status ${status}`;
  }
}

function addMessage(text: string, sender: 'user' | 'assistant', isFallback = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  // Use formatMessage to add link symbolics
  const formattedContent = formatMessage(text);

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
  chatMessages?.appendChild(messageDiv);
  scrollToBottom();
}

function addThinkingMessage() {
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
  chatMessages?.appendChild(messageDiv);
  scrollToBottom();
  return id;
}

function removeThinkingMessage(id: string) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

scrollToBottom();
