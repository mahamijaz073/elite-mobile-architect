import { v2 as cloudinary } from "cloudinary";

let configured = false;

/** Lazily configures the Cloudinary SDK. Throws only when an upload is actually attempted. */
function ensureConfigured(): void {
  if (configured) return;

  const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
  const apiKey = process.env["CLOUDINARY_API_KEY"];
  const apiSecret = process.env["CLOUDINARY_API_SECRET"];

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

/**
 * Uploads an image buffer to Cloudinary and returns its delivery URL, e.g.
 * https://res.cloudinary.com/<cloud_name>/image/upload/q_auto/f_auto/c_scale,w_800/me/bridge/<id>
 */
export function uploadImageBuffer(buffer: Buffer, folder = "me/bridge"): Promise<string> {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto", crop: "scale", width: 800 }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}
