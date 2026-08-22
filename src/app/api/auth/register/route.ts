import { NextResponse } from "next/server";

import {
  hashPassword,
  validateEmail,
  validatePassword,
} from "@/lib/auth/config";
import { createUser, getUserByEmail } from "@/lib/repositories/users";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      rememberMe?: boolean;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const displayName = body.displayName?.trim();

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

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册", code: "EMAIL_EXISTS" },
        { status: 409 }
      );
    }

    const defaultDisplayName = email.split("@")[0] ?? "用户";
    const passwordHash = await hashPassword(password);

    const user = await createUser({
      email,
      passwordHash,
      displayName: displayName || defaultDisplayName,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
