import { getCloudflareContext } from "@opennextjs/cloudflare";

export const db = () => getCloudflareContext().env.DB;

export const json = (data: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });

export const fail = (status: number, error: string) => json({ error }, status);

export async function body<T>(req: Request): Promise<Partial<T>> {
  try {
    const data = await req.json();
    return data && typeof data === "object" ? (data as Partial<T>) : {};
  } catch {
    return {};
  }
}

/** Wraps a handler so a thrown Response is returned instead of a 500. */
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof Response) return e;
      console.error(e);
      return fail(500, "Something went wrong. Try again.");
    }
  };
}

export const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : NaN);
