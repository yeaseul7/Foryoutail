export function createShelterSlug(name: string | undefined, careRegNo: string): string {
  const safeName = (name || '동물보호소')
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || '동물보호소';
  return `${safeName}--${careRegNo.trim()}`;
}

export function shelterCareRegNoFromSlug(slug: string): string {
  const decoded = decodeURIComponent(slug);
  const separatorIndex = decoded.lastIndexOf('--');
  return (separatorIndex >= 0 ? decoded.slice(separatorIndex + 2) : decoded).trim();
}
