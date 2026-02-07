/**
 * Token yönetimi utility fonksiyonları
 * Token'lar localStorage'da saklanır (httpOnly cookie alternatifi)
 */

const ACCESS_TOKEN_KEY = "stockkar_access_token";
const REFRESH_TOKEN_KEY = "stockkar_refresh_token";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Token'ları localStorage'a kaydeder
 */
export function saveTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

/**
 * Access token'ı alır
 */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Refresh token'ı alır
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Tüm token'ları temizler
 */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Token'ların var olup olmadığını kontrol eder
 */
export function hasTokens(): boolean {
  return !!getAccessToken() && !!getRefreshToken();
}

/**
 * Token'dan payload'ı decode eder (expire kontrolü yapmaz)
 */
export function decodeToken(token: string): { userId?: string; email?: string; role?: string; exp?: number } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Token refresh işlemi
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
      credentials: "include",
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    if (data.tokens) {
      saveTokens(data.tokens);
      return data.tokens.accessToken;
    }

    return null;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Access token'ın expire olup olmadığını kontrol eder
 */
export function isAccessTokenExpired(): boolean {
  const token = getAccessToken();
  if (!token) return true;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  // Expire zamanından 30 saniye önce yenile (buffer)
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const bufferTime = 30 * 1000; // 30 seconds
  return Date.now() >= expirationTime - bufferTime;
}
