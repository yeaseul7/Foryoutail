import { auth } from '@/lib/firebase/firebase';

const IMAGE_UPLOAD_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8081/api/images/upload'
    : 'https://kkosunnae-backend-258374777454.asia-northeast3.run.app/api/images/upload';

export async function uploadCardImages(
  files: File[],
  folder?: string
): Promise<string[]> {
  const urls: string[] = [];
  const token = await auth.currentUser?.getIdToken();

  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);

    const res = await fetch(IMAGE_UPLOAD_URL, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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
