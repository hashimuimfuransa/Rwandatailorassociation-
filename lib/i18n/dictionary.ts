import type { Locale } from "@/types";

export interface Dictionary {
  meta: {
    langName: string;
    langShort: string;
  };
  navbar: {
    changeLanguage: string;
    login: string;
    becomeMember: string;
    openMenu: string;
    closeMenu: string;
    primaryNav: string;
    mobileNav: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    subtitle: string;
    ctaMember: string;
    ctaServices: string;
    imageAlt: string;
  };
  partners: {
    kicker: string;
    ariaLabel: string;
  };
  services: {
    kicker: string;
    title: string;
  };
  about: {
    kicker: string;
    title: string;
    paragraph: string;
    readMore: string;
    imageAlt: string;
    pillars: { label: string; text: string }[];
  };
  whyJoin: {
    title: string;
    imageAlt: string;
  };
  featuredTailors: {
    title: string;
    viewAll: string;
    viewProfile: string;
    contactPrefix: string;
    reviewsWord: string;
    portraitAlt: (name: string, business: string) => string;
  };
  news: {
    title: string;
    viewAll: string;
    readMore: string;
    getInTouch: string;
  };
  events: {
    title: string;
    viewAll: string;
  };
  impactStats: {
    title: string;
    viewAll: string;
  };
  gallery: {
    title: string;
    viewLargerAlt: (alt: string) => string;
    previousImage: string;
    nextImage: string;
  };
  testimonials: {
    title: string;
    ariaLabel: string;
  };
  cta: {
    title: string;
    text: string;
    button: string;
  };
  footer: {
    about: string;
    quickLinks: string;
    contactUs: string;
    newsletter: string;
    newsletterText: string;
    emailLabel: string;
    emailPlaceholder: string;
    subscribe: string;
    subscribed: string;
    copyright: string;
    privacyPolicy: string;
    termsOfUse: string;
  };
}

const dictionary: Record<Locale, Dictionary> = {
  en: {
    meta: {
      langName: "English",
      langShort: "EN",
    },
    navbar: {
      changeLanguage: "Change language",
      login: "Login",
      becomeMember: "Become Member",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      primaryNav: "Primary",
      mobileNav: "Mobile",
    },
    hero: {
      titleLine1: "Empowering Rwanda's Tailors.",
      titleLine2: "Building Rwanda's",
      titleLine3: "Fashion Industry.",
      subtitle:
        "The official association representing professional tailors across Rwanda. Together we promote quality, innovation, business growth and a stronger tailoring industry.",
      ctaMember: "Become a Member",
      ctaServices: "Explore Our Services",
      imageAlt:
        "Rwandan tailors at work on industrial sewing machines in a busy workshop",
    },
    partners: {
      kicker: "Our Partners",
      ariaLabel: "Our partners",
    },
    services: {
      kicker: "Our Services",
      title: "How We Support Our Members",
    },
    about: {
      kicker: "About Us",
      title: "About Rwanda Tailors Association",
      paragraph:
        "Rwanda Tailors Association (RTA) is the umbrella body of professional tailors in Rwanda. We work to promote high standards, innovation and growth of the tailoring industry while representing the interests of our members.",
      readMore: "Read More About Us",
      imageAlt: "A tailor stitching fabric on a JUKI industrial sewing machine",
      pillars: [
        {
          label: "Our Mission:",
          text: "To empower tailors through skills, innovation and business support.",
        },
        {
          label: "Our Vision:",
          text: "To be a leading tailoring association in Africa.",
        },
        {
          label: "Our Values:",
          text: "Integrity, Excellence, Collaboration and Innovation.",
        },
      ],
    },
    whyJoin: {
      title: "Why Join RTA?",
      imageAlt: "A patterned Rwandan jacket displayed on a mannequin",
    },
    featuredTailors: {
      title: "Featured Tailors",
      viewAll: "View All",
      viewProfile: "View Profile",
      contactPrefix: "Contact",
      reviewsWord: "reviews",
      portraitAlt: (name: string, business: string) =>
        `Portrait of ${name}, tailor at ${business}`,
    },
    news: {
      title: "Latest News",
      viewAll: "View All News",
      readMore: "Read More",
      getInTouch: "Get in Touch",
    },
    events: {
      title: "Upcoming Events",
      viewAll: "View All Events",
    },
    impactStats: {
      title: "Our Impact",
      viewAll: "View All",
    },
    gallery: {
      title: "Gallery",
      viewLargerAlt: (alt: string) => `View larger image: ${alt}`,
      previousImage: "Previous image",
      nextImage: "Next image",
    },
    testimonials: {
      title: "What Our Members Say",
      ariaLabel: "Member testimonials",
    },
    cta: {
      title: "Join Rwanda's Largest Tailoring Community",
      text: "Be part of a strong network of professional tailors building the future of Rwanda's fashion industry.",
      button: "Become a Member Today",
    },
    footer: {
      about:
        "The official association representing professional tailors across Rwanda. Together we build a stronger tailoring industry.",
      quickLinks: "Quick Links",
      contactUs: "Contact Us",
      newsletter: "Newsletter",
      newsletterText: "Subscribe to get the latest news and updates from RTA.",
      emailLabel: "Email address",
      emailPlaceholder: "Your email address",
      subscribe: "Subscribe",
      subscribed: "Thanks for subscribing!",
      copyright: "© 2024 Rwanda Tailors Association. All Rights Reserved.",
      privacyPolicy: "Privacy Policy",
      termsOfUse: "Terms of Use",
    },
  },
  rw: {
    meta: {
      langName: "Ikinyarwanda",
      langShort: "RW",
    },
    navbar: {
      changeLanguage: "Hindura ururimi",
      login: "Injira",
      becomeMember: "Ba Umunyamuryango",
      openMenu: "Fungura menu",
      closeMenu: "Funga menu",
      primaryNav: "Ibanze",
      mobileNav: "Kuri telefone",
    },
    hero: {
      titleLine1: "Guha Ubushobozi Abadozi b'u Rwanda.",
      titleLine2: "Twubaka Inganda",
      titleLine3: "y'Imyenda mu Rwanda.",
      subtitle:
        "Ishyirahamwe nyamwuga rihagarariye abadozi b'umwuga mu Rwanda hose. Turi kumwe kugira ngo duteze imbere ubuziranenge, ubuhanga buhanitse, iterambere ry'ubucuruzi n'inganda y'ubudozi ikomeye.",
      ctaMember: "Ba Umunyamuryango",
      ctaServices: "Reba Serivisi Zacu",
      imageAlt:
        "Abadozi b'u Rwanda bakora ku mashini z'inganda z'ubudozi mu bikorwa byuzuye",
    },
    partners: {
      kicker: "Abafatanyabikorwa Bacu",
      ariaLabel: "Abafatanyabikorwa bacu",
    },
    services: {
      kicker: "Serivisi Zacu",
      title: "Uburyo Dufasha Abanyamuryango Bacu",
    },
    about: {
      kicker: "Abo Turi Bo",
      title: "Ibijyanye n'Ishyirahamwe ry'Abadozi b'u Rwanda",
      paragraph:
        "Ishyirahamwe ry'Abadozi b'u Rwanda (RTA) ni umuryango nyamukuru uhuriramo abadozi b'umwuga mu Rwanda. Dukorera kuzamura ubuziranenge, ubuhanga buhanitse n'iterambere ry'inganda y'ubudozi, mu gihe duhagarariye inyungu z'abanyamuryango bacu.",
      readMore: "Menya Byinshi Kuri Twe",
      imageAlt: "Umudozi arudika umwenda ku mashini y'inganda ya JUKI",
      pillars: [
        {
          label: "Intego Yacu:",
          text: "Guha ubushobozi abadozi binyuze mu bumenyi, ubuhanga buhanitse no gufasha mu bucuruzi.",
        },
        {
          label: "Icyerekezo Cyacu:",
          text: "Kuba ishyirahamwe ry'ubudozi riri ku isonga muri Afurika.",
        },
        {
          label: "Indangagaciro Zacu:",
          text: "Ubunyangamugayo, Ubunyamwuga, Ubufatanye n'Ihanga.",
        },
      ],
    },
    whyJoin: {
      title: "Kuki Wakwiyunga muri RTA?",
      imageAlt: "Ikote ry'Ikinyarwanda ryambitswe ku gishushanyo cy'umuntu",
    },
    featuredTailors: {
      title: "Abadozi Bagaragara",
      viewAll: "Reba Bose",
      viewProfile: "Reba Umwirondoro",
      contactPrefix: "Vugana na",
      reviewsWord: "ibitekerezo",
      portraitAlt: (name: string, business: string) =>
        `Ifoto ya ${name}, umudozi muri ${business}`,
    },
    news: {
      title: "Amakuru Aheruka",
      viewAll: "Reba Amakuru Yose",
      readMore: "Soma Byinshi",
      getInTouch: "Twandikire",
    },
    events: {
      title: "Ibikorwa Bizaza",
      viewAll: "Reba Ibikorwa Byose",
    },
    impactStats: {
      title: "Ibyo Twagezeho",
      viewAll: "Reba Byose",
    },
    gallery: {
      title: "Amafoto",
      viewLargerAlt: (alt: string) => `Reba ifoto nini: ${alt}`,
      previousImage: "Ifoto Ibanziriza",
      nextImage: "Ifoto Ikurikira",
    },
    testimonials: {
      title: "Ibyo Abanyamuryango Bacu Bavuga",
      ariaLabel: "Ibitekerezo by'abanyamuryango",
    },
    cta: {
      title: "Injira mu Muryango Munini w'Abadozi mu Rwanda",
      text: "Ba umwe mu bagize umuryango ukomeye w'abadozi b'umwuga bubaka ejo hazaza h'inganda y'imyenda mu Rwanda.",
      button: "Ba Umunyamuryango Uyu Munsi",
    },
    footer: {
      about:
        "Ishyirahamwe nyamwuga rihagarariye abadozi b'umwuga mu Rwanda hose. Turi kumwe twubaka inganda y'ubudozi ikomeye.",
      quickLinks: "Amahuza Yihuse",
      contactUs: "Twandikire",
      newsletter: "Amakuru Agezweho",
      newsletterText: "Iyandikishe kugira ngo ubone amakuru agezweho ya RTA.",
      emailLabel: "Aderesi ya Email",
      emailPlaceholder: "Andika aderesi yawe ya email",
      subscribe: "Iyandikishe",
      subscribed: "Murakoze Kwiyandikisha!",
      copyright: "© 2024 Ishyirahamwe ry'Abadozi b'u Rwanda. Uburenganzira Bwose Burabitswe.",
      privacyPolicy: "Politiki y'Ibanga",
      termsOfUse: "Amabwiriza y'Ikoreshwa",
    },
  },
};

export default dictionary;
