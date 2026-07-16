import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  variant?: "light" | "dark";
  className?: string;
}

export default function Logo({ variant = "dark", className }: LogoProps) {
  const isLight = variant === "light";

  return (
    <Link
      href="#home"
      aria-label="Rwanda Tailors Association — home"
      className={`flex items-center gap-3 ${className ?? ""}`}
    >
      <Image
        src="/images/rtalogo.jpg"
        alt="Rwanda Tailors Association logo"
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full object-cover"
      />
      <span className="leading-tight">
        <span
          className={`block font-heading text-[15px] font-bold tracking-tight sm:text-[17px] ${
            isLight ? "text-white" : "text-ink"
          }`}
        >
          RWANDA TAILORS
        </span>
        <span className="block font-heading text-[11px] font-semibold tracking-[0.2em] text-primary sm:text-xs">
          ASSOCIATION
        </span>
      </span>
    </Link>
  );
}
