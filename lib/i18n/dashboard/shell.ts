import type { Locale } from "@/types";

/** Chrome around every page: header, user menu, shared controls. */
export interface ShellCopy {
  dashboard: string;
  notifications: string;
  notificationsUnread: string;
  signOut: string;
  signingOut: string;
  openMenu: string;
  closeMenu: string;
  breadcrumb: string;
  changeLanguage: string;
  language: string;
  myAccount: string;
  changePassword: string;
  member: string;
  admin: string;
  superAdmin: string;
}

export const shell: Record<Locale, ShellCopy> = {
  en: {
    dashboard: "Dashboard",
    notifications: "Notifications",
    notificationsUnread: "unread",
    signOut: "Sign out",
    signingOut: "Signing out…",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    breadcrumb: "Breadcrumb",
    changeLanguage: "Change language",
    language: "Language",
    myAccount: "My account",
    changePassword: "Change password",
    member: "Member",
    admin: "Administrator",
    superAdmin: "Super administrator",
  },

  rw: {
    dashboard: "Imbonerahamwe",
    notifications: "Ubutumwa",
    notificationsUnread: "butarasomwa",
    signOut: "Gusohoka",
    signingOut: "Turasohoka…",
    openMenu: "Fungura menu",
    closeMenu: "Funga menu",
    breadcrumb: "Inzira",
    changeLanguage: "Hindura ururimi",
    language: "Ururimi",
    myAccount: "Konti yanjye",
    changePassword: "Hindura ijambobanga",
    member: "Umunyamuryango",
    admin: "Umuyobozi",
    superAdmin: "Umuyobozi mukuru",
  },
};
