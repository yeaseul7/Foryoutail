import { NextRequest, NextResponse } from 'next/server';
import { getCloudinaryConfig, signCloudinaryParams } from '@/lib/cloudinary/edge';

export const runtime = 'edge';

/**
 * Cloudinary URL에서 public_id를 추출
 * @param url Cloudinary 이미지 URL
 * @returns public_id 또는 null
 */
function extractPublicId(url: string): string | null {
  try {
    // Cloudinary URL 형식: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    // 또는: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;

    let publicIdStartIndex = uploadIndex + 1;
    if (
      publicIdStartIndex < pathParts.length &&
      pathParts[publicIdStartIndex].startsWith('v')
    ) {
      publicIdStartIndex++;
    }

    const publicIdParts = pathParts.slice(publicIdStartIndex);
    if (publicIdParts.length === 0) return null;

    const lastPart = publicIdParts[publicIdParts.length - 1];
    const publicId = publicIdParts
      .slice(0, -1)
      .concat(lastPart.replace(/\.[^/.]+$/, ''))
      .join('/');

    return publicId;
  } catch (error) {
    console.error('Failed to extract public_id from URL:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 },
      );
    }

    const publicId = extractPublicId(url);
    if (!publicId) {
      return NextResponse.json(
        { error: 'Invalid Cloudinary URL' },
        { status: 400 },
      );
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const signedParams = { public_id: publicId, timestamp };
    const signature = await signCloudinaryParams(signedParams, apiSecret);

    const deleteForm = new FormData();
    deleteForm.append('public_id', publicId);
    deleteForm.append('timestamp', String(timestamp));
    deleteForm.append('api_key', apiKey);
    deleteForm.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: 'POST',
        body: deleteForm,
      },
    );
    const result = await response.json();

    if (response.ok && (result.result === 'ok' || result.result === 'not found')) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete image from Cloudinary' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to delete image', details: errorMessage },
      { status: 500 },
    );
  }
}
