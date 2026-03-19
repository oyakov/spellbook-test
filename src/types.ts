// src/types.ts

export interface Settings {
  llmProvider: 'gemini' | 'lmstudio';
  embedProvider: 'gemini' | 'lmstudio';
  geminiApiKey: string;
}

export interface DocumentChunk {
  text: string;
  embedding: number[];
  source: string;
}

export interface DocMeta {
  id: string;
  name: string;
  type: 'text' | 'image' | 'audio' | 'pdf';
  source: string;
}

export interface ChatMessage {
  role: string;
  text: string;
}
