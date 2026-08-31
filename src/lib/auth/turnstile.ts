/**
 * 人机验证 + 注册后自动登录凭证。
 *
 * 两套东西别混：
 * - Turnstile token：用户点验证码后拿到，发给 Cloudflare 校验「是不是真人」
 * - loginPass：注册成功后服务端签发，60 秒内有效，用来自动登录，免再点一次验证码
 *
 * 下面的 encode / hmac 是在 Edge 环境里手写的，不用 Node 的 crypto 模块。
 */
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const REGISTER_LOGIN_PASS_TTL_MS = 60_000;

function getTurnstileSecret(): string | undefined {
  return (
    process.env.TURNSTILE_SECRET_KEY ??
    process.env.NEXT_PUBLIC_TURNSTILE_SECRET_KEY
  );
}

function getPassSecret(): string {
  return process.env.AUTH_SECRET ?? getTurnstileSecret() ?? "";
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function encodePass(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodePass(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

/** 比较时间恒定，避免被「猜签名」的计时攻击 */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return toHex(signature);
}

/** 把前端拿到的 token 发给 Cloudflare，确认这次验证码有效 */
export async function verifyTurnstileToken(
  token: string | undefined
): Promise<boolean> {
  const secret = getTurnstileSecret();
  // 本地没配密钥：没开验证码就放行；开了却没配密钥则一律失败
  if (!secret) {
    return !process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  }
  if (!token) {
    return false;
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verify failed:", error);
    return false;
  }
}

/** 注册成功后签发：内容是「邮箱 + 过期时间 + 签名」，前端拿去立刻 signIn */
export async function createRegisterLoginPass(email: string): Promise<string> {
  const exp = Date.now() + REGISTER_LOGIN_PASS_TTL_MS;
  const payload = `${email.toLowerCase()}:${exp}`;
  const sig = await hmacHex(getPassSecret(), payload);
  return encodePass(`${payload}:${sig}`);
}

/** 校验 loginPass：没过期、邮箱对得上、签名没被改过 */
export async function verifyRegisterLoginPass(
  email: string,
  pass: string | undefined
): Promise<boolean> {
  if (!pass) {
    return false;
  }

  try {
    const decoded = decodePass(pass);
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) {
      return false;
    }
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const [passEmail, expRaw] = payload.split(":");
    const exp = Number(expRaw);
    if (!passEmail || !Number.isFinite(exp) || Date.now() > exp) {
      return false;
    }
    if (passEmail !== email.toLowerCase()) {
      return false;
    }

    const expected = await hmacHex(getPassSecret(), payload);
    return timingSafeEqualHex(sig, expected);
  } catch {
    return false;
  }
}
