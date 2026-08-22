/**
 * 性能冒烟测试：页面加载 + 聊天 API 响应时间
 * 用法: pnpm tsx scripts/perf-test.ts
 */
import "dotenv/config";

const BASE = process.env.PERF_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.PERF_EMAIL ?? "perf-test@example.com";
const PASSWORD = process.env.PERF_PASSWORD ?? "Test1234";

interface TimedResult {
  label: string;
  ms: number;
  detail?: string;
}

function ms(start: number): number {
  return Math.round(performance.now() - start);
}

function avg(nums: number[]): number {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function fmt(n: number): string {
  return `${n}ms`;
}

async function login(): Promise<string> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const csrfCookie = csrfRes.headers.getSetCookie?.()?.join("; ") ?? "";

  const body = new URLSearchParams({
    csrfToken,
    email: EMAIL,
    password: PASSWORD,
    rememberMe: "false",
    callbackUrl: "/",
    json: "true",
  });

  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: body.toString(),
    redirect: "manual",
  });

  const setCookies =
    loginRes.headers.getSetCookie?.() ??
    (loginRes.headers.get("set-cookie")
      ? [loginRes.headers.get("set-cookie")!]
      : []);
  const sessionCookie = setCookies.find((c) =>
    c.includes("authjs.session-token=")
  );
  if (!sessionCookie && loginRes.status !== 302) {
    throw new Error(`登录失败，状态 ${loginRes.status}，无 session cookie`);
  }
  if (!sessionCookie) {
    throw new Error(`登录失败，状态 ${loginRes.status}，无 session cookie`);
  }
  const allCookies = [...setCookies, csrfCookie]
    .filter(Boolean)
    .map((c) => c.split(";")[0])
    .join("; ");
  return allCookies;
}

async function measurePage(
  cookie: string,
  path: string,
  label: string
): Promise<TimedResult> {
  const start = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Cookie: cookie },
  });
  const text = await res.text();
  const elapsed = ms(start);
  return {
    label,
    ms: elapsed,
    detail: `HTTP ${res.status}, ${(text.length / 1024).toFixed(1)}KB`,
  };
}

async function measureChat(
  cookie: string,
  boyfriendId: string,
  message: string
): Promise<{
  ttfb: number;
  firstToken: number;
  fullStream: number;
  contentLength: number;
}> {
  const start = performance.now();
  let ttfb = 0;
  let firstToken = 0;
  let contentLength = 0;

  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ boyfriendId, userMessage: message }),
  });

  ttfb = ms(start);

  const reader = res.body?.getReader();
  if (!reader) throw new Error("无响应体");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (firstToken === 0) firstToken = ms(start);
    buffer += decoder.decode(value, { stream: true });
  }

  const fullStream = ms(start);
  for (const line of buffer.split("\n\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    try {
      const parsed = JSON.parse(trimmed.slice(5).trim()) as { content?: string };
      if (parsed.content) contentLength += parsed.content.length;
    } catch {
      /* skip */
    }
  }

  return { ttfb, firstToken, fullStream, contentLength };
}

async function getFirstBoyfriendId(cookie: string): Promise<string | null> {
  const res = await fetch(`${BASE}/api/boyfriends`, {
    headers: { Cookie: cookie },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { boyfriends?: { id: string }[] } | { id: string }[];
  const list = Array.isArray(data) ? data : (data.boyfriends ?? []);
  return list[0]?.id ?? null;
}

async function main(): Promise<void> {
  console.log("=== 纸片人男友 性能测试 ===");
  console.log(`目标: ${BASE}\n`);

  const loginStart = performance.now();
  const cookie = await login();
  console.log(`✓ 登录成功 (${ms(loginStart)})\n`);

  // --- 页面加载（模拟 router.refresh / 导航）---
  const pageRoutes = [
    { path: "/", label: "主页 /" },
    { path: "/create", label: "创建页 /create" },
    { path: "/login", label: "登录页 /login" },
  ];

  console.log("【页面加载时间】（3 次取平均，含 SSR + DB）");
  for (const route of pageRoutes) {
    const runs: number[] = [];
    let detail = "";
    for (let i = 0; i < 3; i++) {
      const r = await measurePage(cookie, route.path, route.label);
      runs.push(r.ms);
      detail = r.detail ?? "";
    }
    console.log(`  ${route.label}: 平均 ${fmt(avg(runs))} (${runs.map(fmt).join(", ")}) ${detail}`);
  }

  // 聊天页（需 boyfriendId）
  const boyfriendId = await getFirstBoyfriendId(cookie);
  if (boyfriendId) {
    const chatPath = `/chat/${boyfriendId}`;
    const runs: number[] = [];
    let detail = "";
    for (let i = 0; i < 3; i++) {
      const r = await measurePage(cookie, chatPath, chatPath);
      runs.push(r.ms);
      detail = r.detail ?? "";
    }
    console.log(
      `  聊天页 ${chatPath}: 平均 ${fmt(avg(runs))} (${runs.map(fmt).join(", ")}) ${detail}`
    );
  } else {
    console.log("  ⚠ 无男友数据，跳过聊天页测试");
  }

  // --- API 接口 ---
  console.log("\n【API 响应时间】");
  const apiTests = [
    { path: "/api/boyfriends", label: "GET /api/boyfriends" },
  ];
  if (boyfriendId) {
    apiTests.push({
      path: `/api/messages?boyfriendId=${boyfriendId}&limit=50`,
      label: "GET /api/messages",
    });
  }
  for (const api of apiTests) {
    const start = performance.now();
    const res = await fetch(`${BASE}${api.path}`, { headers: { Cookie: cookie } });
    await res.json();
    console.log(`  ${api.label}: ${fmt(ms(start))} (HTTP ${res.status})`);
  }

  // --- 聊天回复 ---
  if (boyfriendId) {
    console.log("\n【聊天回复时间】（POST /api/chat SSE）");
    const messages = ["你好", "今天有点累", "你在干嘛"];
    for (const msg of messages) {
      const r = await measureChat(cookie, boyfriendId, msg);
      console.log(`  消息「${msg}」:`);
      console.log(`    TTFB（首字节）: ${fmt(r.ttfb)}`);
      console.log(`    首个 token:     ${fmt(r.firstToken)}`);
      console.log(`    流式完成:       ${fmt(r.fullStream)} (${r.contentLength} 字)`);
      console.log(`    前端感知（+1.5s 打字延迟）: ~${fmt(Math.max(r.ttfb, 1500) + (r.fullStream - r.firstToken))}`);
    }
  }

  console.log("\n=== 测试完成 ===");
}

main().catch((err) => {
  console.error("测试失败:", err);
  process.exit(1);
});
