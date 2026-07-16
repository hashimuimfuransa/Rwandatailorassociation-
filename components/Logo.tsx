import Link from "next/link";

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
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <circle cx="22" cy="22" r="21" stroke="#20B2AA" strokeWidth="1.5" />
        <path
          d="M13 29c3-7 3-13 9-13s6 6 9 13"
          stroke="#20B2AA"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="22" cy="14" r="2.4" fill="#20B2AA" />
        <path
          d="M9 32.5c4.5-2.5 21.5-2.5 26 0"
          stroke="#20B2AA"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeDasharray="1 3.4"
        />
      </svg>
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
