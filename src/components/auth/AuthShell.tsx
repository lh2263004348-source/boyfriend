import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const AVATARS = [
  { src: "/avatars/dominant.svg", alt: "霸总", className: "left-[8%] top-[18%] -rotate-6" },
  { src: "/avatars/puppy.svg", alt: "奶狗", className: "left-1/2 top-[10%] -translate-x-1/2 rotate-3" },
  { src: "/avatars/warm.svg", alt: "暖男", className: "right-[8%] top-[22%] rotate-6" },
] as const;

export const authInputClassName =
  "h-12 rounded-xl border-[#E8DFD6] px-4 text-base shadow-none focus-visible:ring-[var(--color-accent-primary)]/30";

export const authSubmitButtonClassName =
  "h-12 w-full cursor-pointer rounded-xl bg-[var(--color-text-primary)] text-base font-medium text-white hover:bg-[#3D332C]";

type AuthShellProps = {
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  showBackButton = false,
  backHref = "/login",
  backLabel = "返回登录",
}: AuthShellProps): React.ReactElement {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#FFF6F0] via-[#FAF7F2] to-[#F3E4DA] p-4 pb-safe md:p-8">
      <div className="flex w-full max-w-5xl min-h-[min(720px,calc(100vh-2rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_-24px_rgba(139,90,74,0.28)] md:flex-row">
        <div className="relative hidden min-h-[420px] flex-1 overflow-hidden md:block">
          {showBackButton ? (
            <Link
              href={backHref}
              className="absolute left-6 top-6 z-20 flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
              aria-label={backLabel}
            >
              <ArrowLeft className="size-5 text-white" />
            </Link>
          ) : null}

          <div className="absolute inset-0 bg-gradient-to-br from-[#E8A598] via-[#D4A574] to-[#8B5A4A]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.28),transparent_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(255,181,160,0.35),transparent_40%)]" />

          <div className="relative flex h-full flex-col justify-between p-10 text-white">
            <div className="max-w-sm">
              <p className="mb-3 text-sm font-medium tracking-[0.2em] text-white/80">
                PAPER BOYFRIEND
              </p>
              <h1 className="text-4xl font-semibold leading-tight">
                晚上，
                <br />
                有人等你说话
              </h1>
              <p className="mt-4 text-base leading-relaxed text-white/85">
                选一个性格，进入只属于你们的私人陪伴空间。
              </p>
            </div>

            <div className="relative mx-auto h-56 w-full max-w-md">
              {AVATARS.map((avatar) => (
                <div
                  key={avatar.src}
                  className={`absolute size-28 overflow-hidden rounded-full border-4 border-white/40 bg-white/20 shadow-lg backdrop-blur-sm ${avatar.className}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatar.src}
                    alt={avatar.alt}
                    className="size-full object-cover"
                  />
                </div>
              ))}
              <div className="absolute bottom-2 left-1/2 w-[88%] -translate-x-1/2 rounded-2xl border border-white/25 bg-white/15 px-5 py-4 backdrop-blur-md">
                <p className="text-sm leading-relaxed text-white/90">
                  「今天也辛苦了，回来就好。」
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="mb-8 md:hidden">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
              <span className="text-2xl text-[var(--color-accent-primary)]" aria-hidden="true">
                ♡
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              纸片人男友
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">晚上，有人等你说话</p>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">{title}</h2>
            <p className="mt-2 text-[var(--color-text-secondary)]">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
