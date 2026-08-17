import { getServerSession } from "next-auth";
import { type NextRequest } from "next/server";

import { apiError, apiSuccess } from "../../../../../lib/server/api-response";
import { authOptions } from "../../../../../lib/server/auth";
import { hasDatabaseConfiguration } from "../../../../../lib/server/env";
import { getPrismaClient } from "../../../../../lib/server/prisma";
import { enforceRateLimit } from "../../../../../lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReviewInput = { rating: number; title?: string; body: string; orderNumber: string; email?: string; authorName: string };

function parseReview(value: unknown): ReviewInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const trim = (item: unknown, min: number, max: number): string | null =>
    typeof item === "string" && item.trim().length >= min && item.trim().length <= max ? item.trim() : null;
  const rating = typeof input.rating === "number" && Number.isInteger(input.rating) && input.rating >= 1 && input.rating <= 5 ? input.rating : null;
  const body = trim(input.body, 10, 2000);
  const orderNumber = trim(input.orderNumber, 4, 80);
  const authorName = trim(input.authorName, 2, 120);
  const title = input.title === undefined || input.title === "" ? undefined : trim(input.title, 2, 160);
  const email = input.email === undefined || input.email === "" ? undefined : trim(input.email, 3, 254)?.toLowerCase();
  if (!rating || !body || !orderNumber || !authorName || title === null || email === null) return null;
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return null;
  return { rating, body, orderNumber, authorName, ...(title ? { title } : {}), ...(email ? { email } : {}) };
}

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Reviews are not configured yet.", 503);
  try {
    const cake = await getPrismaClient().cake.findFirst({ where: { slug: params.slug, status: "ACTIVE" }, select: { id: true } });
    if (!cake) return apiError("VALIDATION_ERROR", "Cake not found.", 404);
    const reviews = await getPrismaClient().review.findMany({
      where: { cakeId: cake.id, status: "PUBLISHED" },
      select: { id: true, authorName: true, rating: true, title: true, body: true, createdAt: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return apiSuccess(reviews.map((review) => ({ id: review.id, authorName: review.authorName ?? review.user?.name ?? "Verified customer", rating: review.rating, title: review.title, body: review.body, createdAt: review.createdAt })));
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Reviews are temporarily unavailable.", 503);
  }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  const rateLimitResponse = enforceRateLimit(request, "review-submit", 5, 15 * 60 * 1000);
  if (rateLimitResponse) return rateLimitResponse;
  const input = parseReview(await request.json().catch(() => null));
  if (!input) return apiError("VALIDATION_ERROR", "Provide a rating, review, name, and delivered order number.", 400);
  if (!hasDatabaseConfiguration()) return apiError("CONFIGURATION_ERROR", "Reviews are not configured yet.", 503);

  try {
    const prisma = getPrismaClient();
    const [cake, session] = await Promise.all([
      prisma.cake.findFirst({ where: { slug: params.slug, status: "ACTIVE" }, select: { id: true } }),
      getServerSession(authOptions),
    ]);
    if (!cake) return apiError("VALIDATION_ERROR", "Cake not found.", 404);

    const order = await prisma.order.findFirst({
      where: { orderNumber: input.orderNumber, status: "DELIVERED", items: { some: { cakeId: cake.id } } },
      select: { id: true, email: true, userId: true },
    });
    if (!order) return apiError("VALIDATION_ERROR", "A delivered order containing this cake is required.", 400);
    const isOrderOwner = Boolean(session?.user.id && order.userId === session.user.id);
    const matchesOrderEmail = Boolean(input.email && order.email.toLowerCase() === input.email);
    if (!isOrderOwner && !matchesOrderEmail) return apiError("FORBIDDEN", "That order does not match the supplied customer details.", 403);

    const existing = await prisma.review.findFirst({ where: { orderId: order.id, cakeId: cake.id }, select: { id: true } });
    if (existing) return apiError("VALIDATION_ERROR", "A review for this cake has already been submitted for that order.", 409);

    const review = await prisma.review.create({
      data: { cakeId: cake.id, orderId: order.id, userId: isOrderOwner ? session!.user.id : undefined, authorName: input.authorName, rating: input.rating, title: input.title, body: input.body },
      select: { id: true, status: true, createdAt: true },
    });
    return apiSuccess({ ...review, message: "Thank you. Your review will appear after moderation." }, { status: 201 });
  } catch {
    return apiError("DATABASE_UNAVAILABLE", "Unable to submit your review right now.", 503);
  }
}
