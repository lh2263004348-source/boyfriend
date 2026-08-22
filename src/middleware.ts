import { auth } from "@/lib/auth/config";

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user?.id;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", req.url);
    if (req.nextUrl.pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    }
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: ["/", "/create", "/chat/:path*", "/login", "/register"],
};
