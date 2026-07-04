/** Small client-side fetch wrapper: JSON in/out, throws friendly errors. */
export async function apiFetch<T = unknown>(
  url: string,
  opts: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data && data.error) ||
      `Permintaan gagal (${res.status}).`;
    throw new Error(String(msg));
  }
  return data as T;
}
