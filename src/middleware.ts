/**
 * 路由守卫：请求到达页面前先跑这里。
 *
 * 规则很简单：
 * - 没登录，又不是登录/注册页 → 踢去 /login
 * - 已登录，还去登录/注册页 → 踢回首页
 *
 * matcher 列出要保护的路径；没写进去的（比如 /api/*）不会走这段逻辑。
 */
import { auth } from "@/lib/auth/config";

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user?.id;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", req.url);
    // 记下原来想去的页面，登录成功后可以跳回去
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
