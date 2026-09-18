import apiClient from "./apiClient";

export type MediaUploadResult = {
  url: string;
  publicId: string;
  resourceType: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
};

const MAX_SAVED_IMAGE_BYTES = 20 * 1024;
const COMPRESSED_CATEGORIES = new Set(["school-logo", "student", "teacher", "staff"]);

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be read."));
    };
    image.src = objectUrl;
  });
}

async function compressTo20KB(file: File): Promise<File> {
  const image = await loadImage(file);

  let maxDimension = 512;
  let quality = 0.72;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Image compression is not supported by this browser.");
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );

    if (!blob) {
      throw new Error("Image compression failed.");
    }

    if (blob.size <= MAX_SAVED_IMAGE_BYTES) {
      return new File([blob], "compressed.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    }

    if (quality > 0.25) {
      quality -= 0.08;
    } else {
      maxDimension = Math.max(64, Math.round(maxDimension * 0.8));
      quality = 0.6;
    }
  }

  throw new Error("This image could not be compressed below 20 KB.");
}

export async function uploadImage(
  file: File,
  category: "school-logo" | "student" | "teacher" | "staff" | "payment-proof",
) {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Only JPG and PNG images are allowed.");
  }

  const uploadFile = COMPRESSED_CATEGORIES.has(category)
    ? await compressTo20KB(file)
    : file;

  const formData = new FormData();
  formData.append("file", uploadFile);

  const response = await apiClient.post<MediaUploadResult>(
    `/media/image/${category}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
}

export async function deleteImage(publicId: string) {
  await apiClient.delete("/media/image", { data: { publicId } });
}
