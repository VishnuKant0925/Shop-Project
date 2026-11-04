import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UPLOAD_TIMEOUT_MS = 30_000;

/** Error whose message is safe to show to the customer (see errorHandler). */
export class UploadError extends Error {
  statusCode = 503;
  expose = true;
}

const isConfigured = (): boolean => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const uploadOnce = (buffer: Buffer, folder: string): Promise<UploadApiResponse> =>
  new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        timeout: UPLOAD_TIMEOUT_MS,
      },
      (error, res) => {
        if (error || !res?.secure_url) return reject(error ?? new Error('Cloudinary upload did not return a URL'));
        resolve(res);
      }
    );
    stream.end(buffer);
  });

/**
 * Upload an image to Cloudinary (permanent storage), retrying once on a transient failure.
 *
 * There is deliberately no local-disk fallback: the API host's disk is wiped on every
 * redeploy/restart (e.g. Render), so a "saved" file could silently disappear later.
 * Failing loudly lets the customer simply try again instead.
 */
export const uploadImageFile = async (buffer: Buffer, folder: string): Promise<string> => {
  if (!isConfigured()) {
    console.error('[Upload] Cloudinary is not configured (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).');
    throw new UploadError('Image upload is temporarily unavailable. Please try again later or contact the mill.');
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await uploadOnce(buffer, folder);
      return result.secure_url;
    } catch (err) {
      lastError = err;
      console.warn(`[Upload] Cloudinary upload attempt ${attempt} failed:`, (err as Error)?.message || err);
    }
  }

  console.error('[Upload] Giving up after 2 attempts:', (lastError as Error)?.message || lastError);
  throw new UploadError('We could not upload your image right now. Please try again in a minute.');
};

/** Payment proof screenshots live in their own Cloudinary folder. */
export const uploadPaymentFile = (buffer: Buffer): Promise<string> =>
  uploadImageFile(buffer, 'pandit-mill/payment-screenshots');

export default cloudinary;
