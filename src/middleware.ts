import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Role-based redirects
    if (pathname.startsWith("/admin") && !token.role?.includes("admin")) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/vendor") && !token.role?.includes("vendor")) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    if (pathname.startsWith("/client") && !token.role?.includes("client")) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Allow access to login page without token
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/client/:path*", "/dashboard"],
};
