/**
 * Auth.js 的 HTTP 入口。
 *
 * 前端 signIn() / signOut() 会打到 /api/auth/*，
 * 真正的校验逻辑在 src/lib/auth/config.ts，这里只是把 handlers 挂到路由上。
 */
import { handlers } from "@/lib/auth/config";

export const { GET, POST } = handlers;
