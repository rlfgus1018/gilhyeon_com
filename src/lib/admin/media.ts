/** 미디어 업로드 제한 (0002_storage.sql 버킷 설정과 일치) */
export const MEDIA_BUCKET = "media";
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;
export const MEDIA_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
