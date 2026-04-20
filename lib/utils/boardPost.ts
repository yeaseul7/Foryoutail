/** 본문 HTML에서 표시용 제목 한 줄 추출 (이미지만 있을 때는 기본 문구) */
export function deriveBoardTitleFromHtml(html: string): string {
  const stripped = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (stripped.length >= 1) {
    return stripped.length > 60 ? `${stripped.slice(0, 60).trimEnd()}…` : stripped;
  }
  return '사진 게시글';
}

/** 썸네일·본문에서 이미지가 앞에 오도록 Cloudinary URL 블록을 기존 HTML 앞에 붙임 */
export function prependImageUrlsToHtmlContent(imageUrls: string[], existingHtml: string): string {
  const imgs = imageUrls.map((url) => `<p><img src="${url}" alt="" /></p>`).join('');
  const rest = existingHtml?.trim() ? existingHtml : '';
  return imgs + rest;
}
