const ANIMAL_IMAGE_HOSTS = new Set([
  'openapi.animal.go.kr',
  'www.animal.go.kr',
]);

export function isAnimalApiImageUrl(src?: string | null): boolean {
  if (!src) return false;

  try {
    return ANIMAL_IMAGE_HOSTS.has(new URL(src).hostname);
  } catch {
    return src.includes('openapi.animal.go.kr') || src.includes('www.animal.go.kr');
  }
}

export function normalizeAnimalImageUrl(src: string): string {
  if (!isAnimalApiImageUrl(src)) return src;

  try {
    const url = new URL(src);
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }
    return url.toString();
  } catch {
    return src.replace(/^http:\/\/(?=(?:openapi|www)\.animal\.go\.kr)/, 'https://');
  }
}

export function shouldBypassNextImageOptimization(src?: string | null): boolean {
  if (!src) return false;
  return src.startsWith('/static/') || isAnimalApiImageUrl(src);
}
