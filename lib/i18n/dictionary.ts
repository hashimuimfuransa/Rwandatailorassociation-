import type { Locale } from "@/types";

export interface Dictionary {
  meta: {
    langName: string;
    langShort: string;
  };
  common: {
    back: string;
  };
  navbar: {
    changeLanguage: string;
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
  news: {
    title: string;
    description: string;
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
  contact: {
    kicker: string;
    title: string;
    description: string;
    addressLabel: string;
    phoneLabel: string;
    emailLabel: string;
    followUs: string;
    mapTitle: string;
    registerTitle: string;
    registerText: string;
    registerButton: string;
    registerNewTab: string;
  };
}

const dictionary: Record<Locale, Dictionary> = {
  en: {
    meta: {
      langName: "English",
      langShort: "EN",
    },
    common: {
      back: "Back",
    },
    navbar: {
      changeLanguage: "Change language",
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
        "The official association representing tailors across Rwanda. Together we promote quality, innovation, business growth and a stronger tailoring industry.",
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
        "Rwanda Tailors Association (RTA) is the umbrella body of tailors in Rwanda. We work to promote high standards, innovation and growth of the tailoring industry while representing the interests of our members.",
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
    news: {
      title: "Latest News",
      description:
        "Stay up to date with partnerships, trainings, events and member stories from across the RTA community.",
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
      text: "Be part of a strong network of tailors building the future of Rwanda's fashion industry.",
      button: "Become a Member Today",
    },
    footer: {
      about:
        "The official association representing tailors across Rwanda. Together we build a stronger tailoring industry.",
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
    contact: {
      kicker: "Contact Us",
      title: "Get in Touch",
      description:
        "Have a question or ready to join? Reach out to the RTA team using the details below, or register your membership online in just a few minutes.",
      addressLabel: "Our Office",
      phoneLabel: "Call Us",
      emailLabel: "Email Us",
      followUs: "Follow Us",
      mapTitle: "RTA office location map",
      registerTitle: "Ready to Become a Member?",
      registerText:
        "Fill out our official online membership registration form — available in English and Kinyarwanda and takes about 5 minutes.",
      registerButton: "Register Online Now",
      registerNewTab: "Open full form in a new tab",
    },
  },
  rw: {
    meta: {
      langName: "Ikinyarwanda",
      langShort: "RW",
    },
    common: {
      back: "Garuka",
    },
    navbar: {
      changeLanguage: "Hindura ururimi",
      becomeMember: "Ba Umunyamuryango",
      openMenu: "Fungura menu",
      closeMenu: "Funga menu",
      primaryNav: "Ibanze",
      mobileNav: "Kuri telefone",
    },
    hero: {
      titleLine1: "Guha Abadozi b'u Rwanda Ubushobozi.",
      titleLine2: "Duteza Imbere",
      titleLine3: "Ubudozi mu Rwanda.",
      subtitle:
        "Ishyirahamwe rihagarariye abadozi b'umwuga mu Rwanda hose. Turi kumwe kugira ngo duteze imbere ubuziranenge, ubuhanga buhanitse, iterambere ry'ubucuruzi n'inganda y'ubudozi ikomeye.",
      ctaMember: "Ba Umunyamuryango",
      ctaServices: "Menya Serivisi Zacu",
      imageAlt:
        "Abadozi b'u Rwanda bakora ku mashini z'inganda mu bikorwa by'ubudozi byuzuye",
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
      title: "Kuki Wakwinjira muri RTA?",
      imageAlt: "Ikote ry'Ikinyarwanda ryambitswe ku gishushanyo cy'umuntu",
    },
    news: {
      title: "Amakuru Aheruka",
      description:
        "Menya amakuru agezweho ku bufatanye, amahugurwa, ibikorwa n'inkuru z'abanyamuryango ba RTA.",
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
        "Ishyirahamwe rihagarariye abadozi b'umwuga mu Rwanda hose. Turi kumwe twubaka inganda y'ubudozi ikomeye.",
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
    contact: {
      kicker: "Twandikire",
      title: "Tuvugishe",
      description:
        "Ufite ikibazo cyangwa witeguye kwinjira muri RTA? Vugana n'itsinda ryacu ukoresheje amakuru akurikira, cyangwa wiyandikishe ubunyamuryango kuri interineti mu minota mike.",
      addressLabel: "Ibiro Byacu",
      phoneLabel: "Duhamagare",
      emailLabel: "Dutumire Imeri",
      followUs: "Dukurikire",
      mapTitle: "Ikarita y'aho ibiro bya RTA biherereye",
      registerTitle: "Witeguye Kuba Umunyamuryango?",
      registerText:
        "Uzuza ifishi yacu yemewe yo kwiyandikisha kuri interineti — iraboneka mu Cyongereza no mu Kinyarwanda kandi imara iminota itanu gusa.",
      registerButton: "Iyandikishe Kuri Interineti",
      registerNewTab: "Fungura ifishi yose mu tabu rishya",
    },
  },
};

export default dictionary;
