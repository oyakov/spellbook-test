// src/utils/rag.ts
import type { DocumentChunk, Settings } from '../types';
import { authFetch } from '../services/api';

export function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = start + size;
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }
  return chunks;
}

export async function embedChunks(
  chunks: string[], 
  source: string, 
  settings: Settings
): Promise<DocumentChunk[]> {
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

export function cosineSimilarity(a: number[], b: number[]): number {
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

export async function getContext(
  query: string, 
  vectorStore: DocumentChunk[], 
  settings: Settings, 
  topK = 3
): Promise<string> {
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
    return `__ERROR__: ${e instanceof Error ? e.message : 'Unknown connection error'}`;
  }
}
