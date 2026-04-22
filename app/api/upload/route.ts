import { NextRequest, NextResponse } from 'next/server';
import { getCloudinaryConfig, signCloudinaryParams } from '@/lib/cloudinary/edge';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string)?.trim() || 'unleashed';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const signedParams = { folder, timestamp };
    const signature = await signCloudinaryParams(signedParams, apiSecret);

    const uploadForm = new FormData();
    uploadForm.append('file', file, file.name);
    uploadForm.append('folder', folder);
    uploadForm.append('timestamp', String(timestamp));
    uploadForm.append('api_key', apiKey);
    uploadForm.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadForm,
      },
    );

    const result = await response.json();
    if (!response.ok) {
      const message =
        typeof result?.error?.message === 'string'
          ? result.error.message
          : 'Cloudinary upload failed';
      throw new Error(message);
    }

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    // Log full error for debugging
    console.error('=== Cloudinary upload error ===');
    console.error('Error:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error stringified:', JSON.stringify(error, null, 2));
    }
    console.error('================================');

    // More detailed error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails =
      error instanceof Error ? error.stack : JSON.stringify(error);

    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: errorMessage,
        // Only include stack in development
        ...(process.env.NODE_ENV === 'development' && { stack: errorDetails }),
      },
      { status: 500 },
    );
  }
}
