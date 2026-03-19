// src/services/auth.ts

export async function checkAuthStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/user');
    const data = await res.json();
    return data.authenticated;
  } catch (err) {
    console.error("Auth check failed", err);
    return false;
  }
}

export async function login(password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    return res.ok;
  } catch (err) {
    console.error("Login failed", err);
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (err) {
    console.error("Logout failed", err);
  }
}
