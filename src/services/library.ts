// src/services/library.ts
import { authFetch } from './api';
import type { DocMeta, DocumentChunk, Settings } from '../types';
import { chunkText, embedChunks } from '../utils/rag';

export async function fetchLibraryTemplates(): Promise<string[]> {
  try {
    const res = await authFetch('/api/library');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch library templates", err);
  }
  return [];
}

export async function processLibraryTemplate(
  fileName: string,
  docId: string,
  settings: Settings,
  onProgress: (status: 'ready' | 'error') => void
): Promise<{ meta: DocMeta; chunks: DocumentChunk[] } | null> {
  const isImage = fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg');
  const isAudio = fileName === 'Contract_Briefing.txt'; // Simulated audio

  try {
    const response = await authFetch(`/library/${fileName}`);
    if (isImage) {
      const name = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      onProgress('ready');
      return {
        meta: { id: docId, name, type: 'image', source: `Library: ${fileName}` },
        chunks: []
      };
    } else {
      const text = await response.text();
      const chunks = chunkText(text);
      const embeddedChunks = await embedChunks(chunks, `Library: ${fileName}`, settings);
      
      const name = fileName.split('.')[0].replace(/_/g, ' ');
      onProgress('ready');
      return {
        meta: { id: docId, name, type: isAudio ? 'audio' : 'text', source: `Library: ${fileName}` },
        chunks: embeddedChunks
      };
    }
  } catch (error) {
    console.error(`Failed to load library doc ${fileName}:`, error);
    onProgress('error');
    return null;
  }
}

export async function deleteLibraryFile(fileName: string) {
  return await authFetch(`/api/library/${encodeURIComponent(fileName)}`, { method: 'DELETE' });
}
