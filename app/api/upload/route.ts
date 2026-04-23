import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const IMAGE_UPLOAD_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8081/api/images/upload'
    : 'https://kkosunnae-backend-258374777454.asia-northeast3.run.app/api/images/upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const response = await fetch(IMAGE_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        typeof result?.error === 'string'
          ? result.error
          : 'Image upload failed';
      throw new Error(message);
    }

    return NextResponse.json({
      url: result.url ?? result.image?.secureUrl,
      publicId: result.publicId ?? result.image?.publicId,
      image: result.image,
    });
  } catch (error) {
    console.error('=== Image upload error ===');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error stringified:', JSON.stringify(error, null, 2));
    }
    console.error('==========================');

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails =
      error instanceof Error ? error.stack : JSON.stringify(error);

    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails }),
      },
      { status: 500 },
    );
  }
}
