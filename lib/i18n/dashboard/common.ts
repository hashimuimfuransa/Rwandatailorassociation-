import type { Locale } from "@/types";

/** Words that recur across screens. */
export interface CommonCopy {
  search: string;
  apply: string;
  clear: string;
  cancel: string;
  save: string;
  saving: string;
  confirm: string;
  back: string;
  view: string;
  viewAll: string;
  edit: string;
  delete: string;
  loading: string;
  noResults: string;
  total: string;
  status: string;
  date: string;
  amount: string;
  balance: string;
  reference: string;
  description: string;
  actions: string;
  page: string;
  of: string;

  submit: string;
  submitting: string;
  close: string;
  optional: string;
  notRecorded: string;
  none: string;
  all: string;
  yes: string;
  no: string;
  approve: string;
  approving: string;
  reject: string;
  rejecting: string;
  pending: string;
  approved: string;
  rejected: string;
  member: string;
  members: string;
  name: string;
  fullName: string;
  phone: string;
  email: string;
  type: string;
  method: string;
  note: string;
  reason: string;
  recorded: string;
  download: string;
  export: string;
  filter: string;
  filters: string;
  from: string;
  to: string;
  copy: string;
  copied: string;
  retry: string;
  serverUnreachable: string;
  noPermission: string;
}

export const common: Record<Locale, CommonCopy> = {
  en: {
    search: "Search",
    apply: "Apply",
    clear: "Clear",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    confirm: "Confirm",
    back: "Back",
    view: "View",
    viewAll: "View all",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading…",
    noResults: "No results",
    total: "Total",
    status: "Status",
    date: "Date",
    amount: "Amount",
    balance: "Balance",
    reference: "Reference",
    description: "Description",
    actions: "Actions",
    page: "Page",
    of: "of",

    submit: "Submit",
    submitting: "Submitting…",
    close: "Close",
    optional: "Optional",
    notRecorded: "Not recorded",
    none: "None",
    all: "All",
    yes: "Yes",
    no: "No",
    approve: "Approve",
    approving: "Approving…",
    reject: "Reject",
    rejecting: "Rejecting…",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    member: "Member",
    members: "Members",
    name: "Name",
    fullName: "Full name",
    phone: "Phone number",
    email: "Email",
    type: "Type",
    method: "Method",
    note: "Note",
    reason: "Reason",
    recorded: "Recorded",
    download: "Download",
    export: "Export",
    filter: "Filter",
    filters: "Filters",
    from: "From",
    to: "To",
    copy: "Copy",
    copied: "Copied",
    retry: "Try again",
    serverUnreachable:
      "Could not reach the server. Check your connection and try again.",
    noPermission: "You do not have permission to do this.",
  },

  rw: {
    search: "Shakisha",
    apply: "Emeza",
    clear: "Siba",
    cancel: "Hagarika",
    save: "Bika",
    saving: "Turabika…",
    confirm: "Emeza",
    back: "Subira inyuma",
    view: "Reba",
    viewAll: "Reba byose",
    edit: "Hindura",
    delete: "Siba",
    loading: "Birimo gupakirwa…",
    noResults: "Nta bisubizo",
    total: "Igiteranyo",
    status: "Imimerere",
    date: "Itariki",
    amount: "Umubare",
    balance: "Amafaranga asigaye",
    reference: "Nimero y'ubwishyu",
    description: "Ibisobanuro",
    actions: "Ibikorwa",
    page: "Urupapuro",
    of: "kuri",

    submit: "Ohereza",
    submitting: "Turohereza…",
    close: "Funga",
    optional: "Ntibigomba",
    notRecorded: "Ntibyanditswe",
    none: "Nta na kimwe",
    all: "Byose",
    yes: "Yego",
    no: "Oya",
    approve: "Emeza",
    approving: "Turemeza…",
    reject: "Anga",
    rejecting: "Turanga…",
    pending: "Bitegereje",
    approved: "Byemejwe",
    rejected: "Byanzwe",
    member: "Umunyamuryango",
    members: "Abanyamuryango",
    name: "Izina",
    fullName: "Amazina yose",
    phone: "Nimero ya telefone",
    email: "Imeyili",
    type: "Ubwoko",
    method: "Uburyo",
    note: "Icyitonderwa",
    reason: "Impamvu",
    recorded: "Byanditswe",
    download: "Kuramo",
    export: "Kohereza hanze",
    filter: "Shungura",
    filters: "Ibishungurwa",
    from: "Kuva",
    to: "Kugeza",
    copy: "Koporora",
    copied: "Byakoporowe",
    retry: "Ongera ugerageze",
    serverUnreachable:
      "Ntitwashoboye kugera kuri seriveri. Reba umurongo wa interineti hanyuma wongere ugerageze.",
    noPermission: "Ntufite uburenganzira bwo kubikora.",
  },
};
