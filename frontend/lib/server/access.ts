import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "./auth";

export async function getAuthenticatedSession() {
  const session = await getServerSession(authOptions);
  return session?.user.id ? session : null;
}

export async function getAdminSession(requiredPermission?: string) {
  const session = await getAuthenticatedSession();
  if (!session?.user.roles.some((role) => role === "admin" || role === "owner")) {
    return null;
  }
  if (requiredPermission && !session.user.permissions.includes(requiredPermission)) {
    return null;
  }

  return session;
}
