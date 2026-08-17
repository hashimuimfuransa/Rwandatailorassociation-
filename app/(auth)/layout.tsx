import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, PiggyBank, ShieldCheck, TrendingUp } from "lucide-react";
import { getDashboardCopy } from "@/lib/i18n/server";
import { LanguageToggle } from "@/components/ui/language-toggle";

/**
 * Authentication layout.
 *
 * A focused two-panel shell rather than the marketing chrome: someone signing
 * in to check a savings balance does not need the site navigation or a
 * "Become a Member" call to action. Branding still carries over — same logo,
 * same teal, same Poppins/Manrope pairing — so it reads as the same
 * organisation rather than a bolted-on portal.
 *
 * The brand panel is hidden below `lg`, where the form deserves the full
 * width; the logo moves inline above the form so branding is never lost.
 *
 * The language switch sits in the header, next to the way back to the website.
 * It has to be here rather than only on the marketing site: a member who
 * arrives straight at a sign-in link would otherwise have no way to reach
 * Kinyarwanda, and reading the cookie means the page renders in their language
 * on the first paint instead of flipping after it loads.
 */

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { d } = await getDashboardCopy();
  const copy = d.auth.layout;

  const highlights = [
    { icon: PiggyBank, title: copy.saveTitle, body: copy.saveBody },
    { icon: TrendingUp, title: copy.borrowTitle, body: copy.borrowBody },
    { icon: ShieldCheck, title: copy.accountedTitle, body: copy.accountedBody },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden bg-footer p-10 xl:p-14 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-noise opacity-40"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-[380px] rounded-full bg-primary/25 blur-3xl"
        />

        <Link
          href="/"
          className="relative flex items-center gap-3"
          aria-label={copy.homeLabel}
        >
          <Image
            src="/images/rtalogo.jpg"
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full object-cover"
          />
          <span className="leading-tight">
            <span className="block font-heading text-[17px] font-bold tracking-tight text-white">
              RWANDA TAILORS
            </span>
            <span className="block font-heading text-xs font-semibold tracking-[0.2em] text-primary">
              ASSOCIATION
            </span>
          </span>
        </Link>

        <div className="relative">
          <h1 className="text-balance font-heading text-[34px] font-bold leading-tight text-white xl:text-[40px]">
            {copy.headline}
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
            {copy.subhead}
          </p>

          <ul className="mt-10 space-y-6">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-heading text-[15px] font-semibold text-white">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-white/60">
                    {item.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Rwanda Tailors Association
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col bg-background">
        <div className="flex items-center justify-between gap-4 px-6 py-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {copy.backToWebsite}
          </Link>

          {/* Shown at every width here — on this page it is the only way in. */}
          <LanguageToggle className="flex" />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 lg:px-10">
          <div className="w-full max-w-[440px]">
            <Link
              href="/"
              className="mb-8 flex items-center gap-3 lg:hidden"
              aria-label={copy.homeLabel}
            >
              <Image
                src="/images/rtalogo.jpg"
                alt=""
                width={44}
                height={44}
                className="size-11 shrink-0 rounded-full object-cover"
              />
              <span className="leading-tight">
                <span className="block font-heading text-[15px] font-bold tracking-tight text-ink">
                  RWANDA TAILORS
                </span>
                <span className="block font-heading text-[11px] font-semibold tracking-[0.2em] text-primary">
                  ASSOCIATION
                </span>
              </span>
            </Link>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
