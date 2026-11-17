const IMAGE_KEYS = [
  "public_url",
  "image_url",
  "image",
  "images",
  "url",
  "file",
  "src",
  "thumbnail",
  "photo",
];
const URL_PATTERN = /(https?:\/\/[^\s'",\]}]+|\/media\/[^\s'",\]}]+)/g;

export function extractImageUrls(value: unknown): string[] {
  if (!value) return [];

  if (typeof value === "string") {
    const text = value.trim();
    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        return extractImageUrls(JSON.parse(text));
      } catch {}
    }
    const found = text.match(URL_PATTERN);
    if (found) return found;
    return /\.(jpe?g|png|webp|gif|heic)(\?.*)?$/i.test(text) ? [text] : [];
  }

  if (Array.isArray(value)) return value.flatMap(extractImageUrls);

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of IMAGE_KEYS) {
      const urls = extractImageUrls(record[key]);
      if (urls.length > 0) return urls;
    }
  }
  return [];
}

export function resolveImageUrl(url: string, businessApiUrl: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  const origin = businessApiUrl.replace(/\/api\/v1\/?$/, "");
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function firstImageUrl(
  value: unknown,
  businessApiUrl: string,
): string | null {
  const [url] = extractImageUrls(value);
  return url ? resolveImageUrl(url, businessApiUrl) : null;
}
