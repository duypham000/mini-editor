/**
 * Standalone Local Auth Bridge — no external backend dependencies.
 */

export async function getAccessToken(): Promise<string | null> {
  return "local-standalone-token";
}

export async function peekAccessToken(): Promise<string | null> {
  return "local-standalone-token";
}

export async function login(_identifier: string, _password: string): Promise<string> {
  return "local-standalone-token";
}

export async function logout(): Promise<void> {
  return;
}

export async function isAuthenticated(): Promise<boolean> {
  return true;
}

export function onAuthChanged(_cb: () => void): () => void {
  return () => {};
}
