import { NextResponse } from "next/server";

import {
  hashPassword,
  validateEmail,
  validatePassword,
} from "@/lib/auth/config";
import { createRegisterLoginPass } from "@/lib/auth/turnstile";
import { createUser, getUserByEmail } from "@/lib/repositories/users";

/**
 * 注册接口：POST /api/auth/register
 *
 * 谁会调它：前端 RegisterForm 提交表单。
 *
 * 整条链路（按顺序往下读即可）：
 * 1. 解析请求体
 * 2. 人机验证（防刷号）
 * 3. 校验邮箱 / 密码格式
 * 4. 确认邮箱没被占用
 * 5. 密码加密后写入 users 表
 * 6. 返回用户信息 + loginPass，让前端立刻自动登录（不用再点一次验证码）
 *
 * 成功：201 + { user, loginPass }
 * 失败：400 / 409 / 500 + { error, code }
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // --- 1. 解析请求体 ---
    const { turnstileToken, ...registrationData } = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      rememberMe?: boolean;
      turnstileToken?: string;
    };

    // 邮箱统一成小写，避免「A@x.com」和「a@x.com」被当成两个账号
    const email = registrationData.email?.trim().toLowerCase();
    const password = registrationData.password;
    const displayName = registrationData.displayName?.trim();

    // --- 2. 去 Cloudflare 验证 Turnstile token ---
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      }
    );
    const verifyResult = (await verifyResponse.json()) as { success?: boolean };
    if (!verifyResult.success) {
      return NextResponse.json(
        { error: "人机验证失败，请重试", code: "CAPTCHA_FAILED" },
        { status: 403 }
      );
    }

    // --- 3. 表单校验：先拦空值，再拦格式 ---
    if (!email || !password) {
      return NextResponse.json(
        { error: "请填写邮箱和密码", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确", code: "INVALID_EMAIL" },
        { status: 400 }
      );
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "密码至少 8 位，且包含字母和数字", code: "INVALID_PASSWORD" },
        { status: 400 }
      );
    }

    // --- 4. 邮箱是否已被注册（409 = 冲突） ---
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    // --- 5. 创建用户：密码绝不明文入库，只存 hash ---
    const defaultDisplayName = email.split("@")[0] ?? "用户";
    const passwordHash = await hashPassword(password);

    const user = await createUser({
      email,
      passwordHash,
      displayName: displayName || defaultDisplayName,
    });

    // --- 6. 返回可公开的用户字段 + 一次性自动登录凭证 ---
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      loginPass: await createRegisterLoginPass(user.email),
    }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
