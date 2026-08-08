import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
  callbacks: {
    authorized: ({ token }) => token?.roles?.some((role) => role === "admin" || role === "owner") ?? false,
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
