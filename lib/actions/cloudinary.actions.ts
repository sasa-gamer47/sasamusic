'use server'

import { v2 as cloudinary } from 'cloudinary';
import { handleError } from '@/lib/utils';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadFileParams {
    file: string; // Base64 encoded file
    resourceType: 'image' | 'video' | 'raw' | 'auto';
    folder: string;
}

export async function uploadFileToCloudinary({ file, resourceType, folder }: UploadFileParams): Promise<string> {
    try {
        const result = await cloudinary.uploader.upload(file, {
            resource_type: resourceType,
            folder: folder,
        });
        return result.secure_url;
    } catch (error) {
        handleError(error);
        throw error;
    }
}
