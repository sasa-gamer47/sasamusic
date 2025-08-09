import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary using server-side env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const { folder = 'sasamusic_audio', publicId } = await req.json().catch(() => ({}));

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary environment variables are not set.' }, { status: 500 });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const paramsToSign: Record<string, string | number> = { timestamp, folder };
    if (publicId) paramsToSign.public_id = publicId;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET as string
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
      publicId: publicId || null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate Cloudinary signature.' }, { status: 500 });
  }
}


