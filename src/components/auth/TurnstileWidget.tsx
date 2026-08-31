"use client";

import { Turnstile } from "@marsidev/react-turnstile";

/**
 * Cloudflare 人机验证小部件。
 * 没配 NEXT_PUBLIC_TURNSTILE_SITE_KEY 时不渲染（本地开发可跳过）。
 * resetKey 变化会整块重挂，用来在登录/注册失败后换一张验证码。
 */
type TurnstileWidgetProps = {
  resetKey?: number;
  onTokenChange: (token: string) => void;
};

export function TurnstileWidget({
  resetKey = 0,
  onTokenChange,
}: TurnstileWidgetProps): React.ReactElement | null {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) {
    return null;
  }

  return (
    <div className="flex justify-center overflow-x-auto">
      <Turnstile
        key={resetKey}
        siteKey={siteKey}
        onSuccess={(token) => {
          onTokenChange(token);
        }}
        onExpire={() => {
          onTokenChange("");
        }}
        onError={() => {
          onTokenChange("");
        }}
        options={{ theme: "light", size: "flexible" }}
      />
    </div>
  );
}
