import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary/cloudinart';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string)?.trim() || 'unleashed';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert buffer to base64 string (Cloudinary prefers base64 over stream for server-side)
    const base64 = buffer.toString('base64');

    // Upload to Cloudinary using base64
    const result = await cloudinary.uploader.upload(
      `data:${file.type};base64,${base64}`,
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
    );

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
