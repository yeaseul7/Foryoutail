/**
 * 이미지들을 Cloudinary에 업로드하고 URL 목록을 반환합니다.
 * 기존 /api/upload API를 호출합니다.
 * @param files - 업로드할 파일 배열
 * @param folder - Cloudinary 폴더 경로. 미지정 시 API 기본값('unleashed') 사용.
 */
export async function uploadCardImages(
    files: File[],
    folder?: string
): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) formData.append('folder', folder);

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error ?? err?.details ?? '이미지 업로드에 실패했습니다.');
        }

        const data = (await res.json()) as { url: string; publicId?: string };
        if (data.url) urls.push(data.url);
    }

    return urls;
}
