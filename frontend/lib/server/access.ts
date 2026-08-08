import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "./auth";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.some((role) => role === "admin" || role === "owner")) {
    return null;
  }

  return session;
}
