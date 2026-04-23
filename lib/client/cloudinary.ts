/**
 * 이미지들을 Cloudinary에 업로드하고 URL 목록을 반환합니다.
 * 백엔드 이미지 업로드 API를 호출합니다.
 * @param files - 업로드할 파일 배열
 * @param folder - Cloudinary 폴더 경로. 미지정 시 API 기본값('unleashed') 사용.
 */
const IMAGE_UPLOAD_URL =
    process.env.NODE_ENV === 'development'
        ? 'http://localhost:8081/api/images/upload'
        : 'https://kkosunnae-backend-258374777454.asia-northeast3.run.app/api/images/upload';

export async function uploadCardImages(
    files: File[],
    folder?: string
): Promise<string[]> {
    const urls: string[] = [];

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (folder) formData.append('folder', folder);

        const res = await fetch(IMAGE_UPLOAD_URL, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error ?? err?.details ?? '이미지 업로드에 실패했습니다.');
        }

        const data = (await res.json()) as {
            url?: string;
            publicId?: string;
            image?: { secureUrl?: string; publicId?: string };
        };
        const uploadedUrl = data.url ?? data.image?.secureUrl;
        if (uploadedUrl) urls.push(uploadedUrl);
    }

    return urls;
}
