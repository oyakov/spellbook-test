// src/services/api.ts

export async function authFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    // Dispatch event to app for re-auth
    window.dispatchEvent(new CustomEvent('unauthorized'));
    throw new Error('Unauthorized');
  }
  return res;
}
