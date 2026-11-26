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
  if (!image.naturalWidth || !image.naturalHeight) {
    throw new Error("The selected image has invalid dimensions.");
  }

  const dimensions = [800, 640, 512, 400, 320, 256, 192, 128, 96, 64];
  const qualities = [0.85, 0.72, 0.58, 0.45, 0.32, 0.22, 0.14];

  for (const maxDimension of dimensions) {
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    for (const quality of qualities) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Image compression is not supported by this browser.");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
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
    }
  }

  throw new Error("This image could not be compressed below 20 KB.");
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  const compressed = await compressTo20KB(file);
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read the compressed logo."));
    reader.readAsDataURL(compressed);
  });
}

export async function uploadImage(
  file: File,
  category: "school-logo" | "student" | "teacher" | "staff" | "payment-proof",
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
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
