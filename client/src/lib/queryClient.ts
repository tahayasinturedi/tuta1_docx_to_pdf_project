import { QueryClient } from "@tanstack/react-query";

// API isteği yapan fonksiyon
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // FormData kontrolü
  const isFormData = data instanceof FormData;
  
  const res = await fetch(url, {
    method,
    // FormData ise header eklemeyin (browser otomatik ekler)
    headers: data && !isFormData ? { "Content-Type": "application/json" } : {},
    // FormData ise direkt gönder, JSON ise stringify yap
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }

  return res;
}

// React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: Infinity,
    },
    mutations: {
      retry: false,
    },
  },
});