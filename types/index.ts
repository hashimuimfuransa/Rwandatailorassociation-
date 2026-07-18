import type { LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type Locale = "en" | "rw";

export type Localized = Record<Locale, string>;

export type LocalizedList = Record<Locale, string[]>;

export interface NavLink {
  label: Localized;
  href: string;
}

export interface StatItem {
  icon: LucideIcon;
  value: string;
  label: Localized;
}

export interface ServiceItem {
  icon: LucideIcon;
  title: Localized;
  description: Localized;
}

export interface PartnerLogo {
  name: string;
  short: string;
  logo: string;
}

export interface NewsItem {
  image: string;
  category: Localized;
  date: Localized;
  title: Localized;
  excerpt: Localized;
  body: LocalizedList;
}

export interface EventItem {
  day: string;
  month: Localized;
  title: Localized;
  location: Localized;
}

export interface GalleryItem {
  image: string;
  alt: Localized;
}

export interface Testimonial {
  name: string;
  role: Localized;
  image: string;
  quote: Localized;
}

export interface FooterLinkGroup {
  title: Localized;
  links: NavLink[];
}

export interface ContactDetail {
  icon: LucideIcon;
  label: Localized;
  value: string;
  href: string;
}

export interface SocialLink {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  href: string;
}
