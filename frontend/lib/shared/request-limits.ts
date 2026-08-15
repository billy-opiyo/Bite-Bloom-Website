export const MAX_API_BODY_BYTES = 1024 * 1024;

export function exceedsMaxBodySize(contentLength: string | null, maximum = MAX_API_BODY_BYTES): boolean {
  if (!contentLength?.trim() || !/^\d+$/.test(contentLength.trim())) return false;
  return Number(contentLength) > maximum;
}
