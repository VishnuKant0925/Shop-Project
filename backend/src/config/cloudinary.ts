import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary with automatic local disk fallback.
 * Returns either Cloudinary secure_url or a local served URL.
 */
export const uploadPaymentFile = async (
  buffer: Buffer,
  originalName: string,
  reqHost: string,
  protocol: string
): Promise<string> => {
  // 1. Try Cloudinary first if credentials are configured
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'pandit-mill/payment-screenshots',
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, res) => {
            if (error || !res) return reject(error ?? new Error('Cloudinary upload failed'));
            resolve(res);
          }
        );
        stream.end(buffer);
      });

      if (result && result.secure_url) {
        return result.secure_url;
      }
    } catch (cloudinaryErr: any) {
      console.warn(
        '[Upload] Cloudinary upload returned an error. Using local storage fallback. Reason:',
        cloudinaryErr?.message || cloudinaryErr
      );
    }
  }

  // 2. Fallback: Save to local disk under backend/uploads/screenshots
  const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const ext = path.extname(originalName) || '.png';
  const fileName = `screenshot-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  const localUrl = `${protocol}://${reqHost}/uploads/screenshots/${fileName}`;
  console.log('[Upload] Saved payment screenshot locally:', localUrl);
  return localUrl;
};

/**
 * Upload a generic image buffer to Cloudinary.
 * Used for product images, service images, etc.
 * Returns the Cloudinary secure_url.
 */
export const uploadImageFile = async (
  buffer: Buffer,
  folder: string
): Promise<string> => {
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, res) => {
        if (error || !res) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve(res);
      }
    );
    stream.end(buffer);
  });

  if (result && result.secure_url) {
    return result.secure_url;
  }

  throw new Error('Cloudinary upload did not return a URL');
};

export default cloudinary;
