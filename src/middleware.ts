import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { isAdminRole, isVendorRole, isClientRole } from "@/lib/auth-utils";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Redirect to login if not authenticated
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userRole = token.role as string;

    // Check admin access
    if (pathname.startsWith("/admin")) {
      if (!isAdminRole(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Check vendor access
    if (pathname.startsWith("/vendor")) {
      if (!isVendorRole(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // Check client access
    if (pathname.startsWith("/client")) {
      if (!isClientRole(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
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
