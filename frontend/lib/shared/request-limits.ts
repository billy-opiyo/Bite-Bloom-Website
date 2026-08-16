export const MAX_API_BODY_BYTES = 1024 * 1024;

export function isJsonContentType(contentType: string | null): boolean {
  return contentType?.split(";", 1)[0]?.trim().toLowerCase() === "application/json";
}

export function exceedsMaxBodySize(contentLength: string | null, maximum = MAX_API_BODY_BYTES): boolean {
  if (!contentLength?.trim() || !/^\d+$/.test(contentLength.trim())) return false;
  return Number(contentLength) > maximum;
}
