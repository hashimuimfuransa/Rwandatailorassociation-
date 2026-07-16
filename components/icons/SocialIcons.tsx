import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.7h2.6l.4-3h-3v-1.9c0-.87.24-1.46 1.5-1.46h1.6V4.3c-.28-.04-1.23-.12-2.34-.12-2.32 0-3.9 1.42-3.9 4.02v2.1H7.7v3h2.66V21h3.14Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.9 10.6 20.3 3h-1.9l-5.5 6.6L8.5 3H3.3l6.7 9.6L3.3 21h1.9l5.8-7 4.6 7h5.2l-6.9-10.4Zm-2 2.4-.7-1L6 4.5h2.1l4.3 6.2.7 1 5.6 8h-2.1l-4.7-6.7Z" />
    </svg>
  );
}

export function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.94 8.5H3.9V20h3.04V8.5ZM5.42 3.5a1.77 1.77 0 1 0 0 3.53 1.77 1.77 0 0 0 0-3.53ZM20.1 20h-3.03v-5.9c0-1.4-.03-3.2-1.95-3.2-1.96 0-2.26 1.53-2.26 3.1V20H9.83V8.5h2.9v1.57h.04c.4-.77 1.4-1.58 2.88-1.58 3.08 0 3.65 2.03 3.65 4.67V20Z" />
    </svg>
  );
}
