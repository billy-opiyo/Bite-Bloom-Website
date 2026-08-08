import "server-only";

type MpesaConfig = {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortCode: string;
  passkey: string;
  callbackUrl: string;
  transactionType: "CustomerPayBillOnline" | "CustomerBuyGoodsOnline";
};

type AccessToken = { value: string; expiresAt: number };
let cachedToken: AccessToken | undefined;

function getConfig(): MpesaConfig {
  const environment = process.env.MPESA_ENVIRONMENT === "production" ? "production" : "sandbox";
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortCode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (!consumerKey || !consumerSecret || !shortCode || !passkey || !callbackUrl) throw new Error("M-Pesa Daraja is not fully configured.");
  if (!/^https:\/\//.test(callbackUrl)) throw new Error("MPESA_CALLBACK_URL must use HTTPS.");
  return { baseUrl: environment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke", consumerKey, consumerSecret, shortCode, passkey, callbackUrl, transactionType: process.env.MPESA_TRANSACTION_TYPE === "CustomerBuyGoodsOnline" ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline" };
}

export function hasMpesaConfiguration(): boolean {
  try { getConfig(); return true; } catch { return false; }
}

function formatTimestamp(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}${value("month")}${value("day")}${value("hour")}${value("minute")}${value("second")}`;
}

export function normalizeMpesaPhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, "");
  if (/^7\d{8}$/.test(digits)) return `254${digits}`;
  if (/^07\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  if (/^2547\d{8}$/.test(digits)) return digits;
  return null;
}

async function getAccessToken(config: MpesaConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const credentials = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64");
  const response = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${credentials}` }, cache: "no-store" });
  const payload = await response.json().catch(() => null) as { access_token?: string; expires_in?: string } | null;
  if (!response.ok || !payload?.access_token) throw new Error("M-Pesa authorization failed.");
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + Math.max(60, Number(payload.expires_in ?? 3599) - 60) * 1000 };
  return cachedToken.value;
}

export type StkPushResult = { merchantRequestId: string; checkoutRequestId: string; customerMessage: string };

export async function initiateStkPush(input: { orderNumber: string; amount: number; phone: string; description: string }): Promise<StkPushResult> {
  const config = getConfig();
  const phone = normalizeMpesaPhone(input.phone);
  if (!phone) throw new Error("Enter a valid Kenyan M-Pesa phone number.");
  const timestamp = formatTimestamp(new Date());
  const password = Buffer.from(`${config.shortCode}${config.passkey}${timestamp}`).toString("base64");
  const token = await getAccessToken(config);
  const response = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ BusinessShortCode: config.shortCode, Password: password, Timestamp: timestamp, TransactionType: config.transactionType, Amount: Math.round(input.amount), PartyA: phone, PartyB: config.shortCode, PhoneNumber: phone, CallBackURL: config.callbackUrl, AccountReference: input.orderNumber, TransactionDesc: input.description.slice(0, 120) }),
  });
  const payload = await response.json().catch(() => null) as { MerchantRequestID?: string; CheckoutRequestID?: string; CustomerMessage?: string; errorMessage?: string } | null;
  if (!response.ok || !payload?.CheckoutRequestID || !payload.MerchantRequestID) throw new Error(payload?.errorMessage ?? "M-Pesa could not start the payment request.");
  return { merchantRequestId: payload.MerchantRequestID, checkoutRequestId: payload.CheckoutRequestID, customerMessage: payload.CustomerMessage ?? "Check your phone to complete payment." };
}
