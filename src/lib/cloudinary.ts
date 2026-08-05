import "server-only";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  version: number;
  width: number;
  height: number;
  format: string;
};

// publicId must be the same stable per-slot id every time a given image is
// replaced (see property_images.cloudinary_public_id) — overwrite:true means
// re-uploading onto that id replaces the asset in place instead of creating
// a duplicate.
export async function uploadPropertyImage(
  file: File,
  publicId: string
): Promise<CloudinaryUploadResult> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    version: result.version,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

export async function deletePropertyImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
