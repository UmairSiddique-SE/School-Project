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

export async function uploadImage(file: File, category: "school-logo" | "student" | "teacher" | "staff" | "payment-proof") {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Only JPG and PNG images are allowed.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image must be 2 MB or smaller.");
  }

  const formData = new FormData();
  formData.append("file", file);

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
