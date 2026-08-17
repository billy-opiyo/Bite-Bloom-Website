export type MpesaCallbackItem = { Name: string; Value: string | number };

export type MpesaStkCallback = {
  MerchantRequestID?: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc?: string;
  CallbackMetadata?: { Item: MpesaCallbackItem[] };
};

function identifier(value: unknown): string | null {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value) ? value : null;
}

function description(value: unknown): string | undefined | null {
  if (value === undefined) return undefined;
  return typeof value === "string" && value.trim().length <= 512 ? value.trim() || undefined : null;
}

function callbackItems(value: unknown): MpesaCallbackItem[] | null {
  if (!value || typeof value !== "object") return null;
  const items = (value as { Item?: unknown }).Item;
  if (items === undefined) return [];
  if (!Array.isArray(items) || items.length > 20) return null;
  const parsed: MpesaCallbackItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") return null;
    const input = item as { Name?: unknown; Value?: unknown };
    if (typeof input.Name !== "string" || input.Name.trim().length === 0 || input.Name.trim().length > 64) return null;
    if (typeof input.Value === "number" && Number.isFinite(input.Value)) {
      parsed.push({ Name: input.Name.trim(), Value: input.Value });
    } else if (typeof input.Value === "string" && input.Value.length <= 256) {
      parsed.push({ Name: input.Name.trim(), Value: input.Value });
    } else {
      return null;
    }
  }
  return parsed;
}

export function parseMpesaCallback(value: unknown): MpesaStkCallback | null {
  if (!value || typeof value !== "object") return null;
  const body = (value as { Body?: unknown }).Body;
  if (!body || typeof body !== "object") return null;
  const callback = (body as { stkCallback?: unknown }).stkCallback;
  if (!callback || typeof callback !== "object") return null;
  const input = callback as { MerchantRequestID?: unknown; CheckoutRequestID?: unknown; ResultCode?: unknown; ResultDesc?: unknown; CallbackMetadata?: unknown };
  const checkoutRequestId = identifier(input.CheckoutRequestID);
  if (!checkoutRequestId || typeof input.ResultCode !== "number" || !Number.isInteger(input.ResultCode) || input.ResultCode < 0 || input.ResultCode > 1_000_000) return null;
  const merchantRequestId = input.MerchantRequestID === undefined ? undefined : identifier(input.MerchantRequestID);
  if (input.MerchantRequestID !== undefined && !merchantRequestId) return null;
  const resultDescription = description(input.ResultDesc);
  if (resultDescription === null) return null;
  const items = input.CallbackMetadata === undefined ? undefined : callbackItems(input.CallbackMetadata);
  if (items === null) return null;
  return { CheckoutRequestID: checkoutRequestId, ResultCode: input.ResultCode, ...(merchantRequestId ? { MerchantRequestID: merchantRequestId } : {}), ...(resultDescription ? { ResultDesc: resultDescription } : {}), ...(items === undefined ? {} : { CallbackMetadata: { Item: items } }) };
}
