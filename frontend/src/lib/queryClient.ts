import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAccessToken, isAccessTokenExpired, getRefreshToken, saveTokens, clearTokens, refreshAccessToken } from "./token";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
      } else {
        const text = await res.text();
        errorMessage = text || res.statusText;
      }
    } catch {
      // If parsing fails, use status text
      errorMessage = res.statusText;
    }
    const error = new Error(`${res.status}: ${errorMessage}`);
    (error as any).status = res.status;
    (error as any).response = errorMessage;
    throw error;
  }
}

// refreshAccessToken fonksiyonu token.ts'den import ediliyor

/**
 * API request wrapper - otomatik token ekleme ve refresh
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  retryCount = 0,
): Promise<Response> {
  // Token'ı al ve expire kontrolü yap
  let accessToken = getAccessToken();
  
  // Token expire olmuşsa refresh et
  if (accessToken && isAccessTokenExpired()) {
    accessToken = await refreshAccessToken();
  }

  // Headers hazırla
  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // 401 hatası alırsak ve henüz retry yapmadıysak, token refresh dene
  if (res.status === 401 && retryCount === 0) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Yeni token ile tekrar dene
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryRes = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      await throwIfResNotOk(retryRes);
      return retryRes;
    }
    // Refresh başarısız, token'ları temizle
    clearTokens();
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Token'ı al ve expire kontrolü yap
    let accessToken = getAccessToken();
    
    if (accessToken && isAccessTokenExpired()) {
      accessToken = await refreshAccessToken();
    }

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    let res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    // 401 hatası alırsak token refresh dene
    if (res.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(queryKey.join("/") as string, {
          headers,
          credentials: "include",
        });
      } else {
        clearTokens();
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
