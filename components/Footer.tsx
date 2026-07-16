"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import Logo from "@/components/Logo";
import NewsletterForm from "@/components/NewsletterForm";
import {
  FacebookIcon,
  InstagramIcon,
  XIcon,
  LinkedinIcon,
} from "@/components/icons/SocialIcons";
import { FOOTER_LINKS } from "@/lib/data";
import { useLanguage } from "@/components/LanguageProvider";

const SOCIALS = [
  { icon: FacebookIcon, label: "Facebook", href: "#" },
  { icon: InstagramIcon, label: "Instagram", href: "#" },
  { icon: XIcon, label: "Twitter / X", href: "#" },
  { icon: LinkedinIcon, label: "LinkedIn", href: "#" },
];

const CONTACT = [
  { icon: MapPin, text: "KN 63 St, Nyarugenge, Kigali, Rwanda" },
  { icon: Phone, text: "+250 788 123 456" },
  { icon: Mail, text: "info@rta.rw" },
  { icon: Globe, text: "www.rta.rw" },
];

export default function Footer() {
  const { locale, t } = useLanguage();

  return (
    <footer id="contact" className="border-t border-border bg-ink text-white">
      <div className="container-page grid grid-cols-2 gap-10 py-16 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 sm:col-span-1">
          <Logo variant="light" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/65">
            {t.footer.about}
          </p>
          <div className="mt-6 flex items-center gap-3">
            {SOCIALS.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-primary hover:bg-primary hover:text-white"
              >
                <social.icon className="size-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>

        {FOOTER_LINKS.map((group) => (
          <div key={group.title.en}>
            <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-white/90">
              {group.title[locale]}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href + link.label.en}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-white/65 transition-colors hover:text-primary"
                  >
                    {link.label[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-white/90">
            {t.footer.contactUs}
          </h3>
          <ul className="mt-4 space-y-2.5 text-[13px] text-white/65">
            {CONTACT.map((item) => (
              <li key={item.text} className="flex items-start gap-2">
                <item.icon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-white/90">
            {t.footer.newsletter}
          </h3>
          <p className="mt-4 text-[13px] leading-relaxed text-white/65">
            {t.footer.newsletterText}
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/55 sm:flex-row">
          <p>{t.footer.copyright}</p>
          <div className="flex items-center gap-5">
            <Link href="#" className="hover:text-primary">
              {t.footer.privacyPolicy}
            </Link>
            <Link href="#" className="hover:text-primary">
              {t.footer.termsOfUse}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
