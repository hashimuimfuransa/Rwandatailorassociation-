/**
 * Rwanda Tailors Association (RTA) — Membership Registration Form generator.
 *
 * HOW TO USE
 * 1. Go to https://script.google.com, sign in with the Google account that
 *    should own the form (e.g. info.rta24@gmail.com), and create a New project.
 * 2. Delete the default code in Code.gs and paste this entire file in its place.
 * 3. In the function dropdown at the top, select "createRTAForm" and click Run.
 * 4. The first run asks for authorization (Forms, Drive, Gmail) — approve it.
 * 5. Open View > Logs (or Executions) to copy the "Form URL" it prints.
 *    Paste that URL into MEMBERSHIP_FORM_URL in lib/data.ts on the website.
 * 6. Every submission is saved to a linked Google Sheet AND emailed to
 *    NOTIFY_EMAIL below automatically.
 *
 * Re-running createRTAForm() creates a brand-new form each time, so only run
 * it once. To change questions afterwards, edit the form directly in Google
 * Forms, or tweak this script and re-run it for a fresh copy.
 */

const NOTIFY_EMAIL = "info.rta24@gmail.com";

const PROVINCES_EN = [
  "Kigali City",
  "Northern Province",
  "Southern Province",
  "Eastern Province",
  "Western Province",
];

const PROVINCES_RW = [
  "Umujyi wa Kigali",
  "Intara y'Amajyaruguru",
  "Intara y'Amajyepfo",
  "Intara y'Iburasirazuba",
  "Intara y'Iburengerazuba",
];

// Rwanda's 30 districts (same names in both languages).
const DISTRICTS = [
  "Gasabo", "Kicukiro", "Nyarugenge",
  "Burera", "Gakenke", "Gicumbi", "Musanze", "Rulindo",
  "Gisagara", "Huye", "Kamonyi", "Muhanga", "Nyamagabe", "Nyanza", "Nyaruguru", "Ruhango",
  "Bugesera", "Gatsibo", "Kayonza", "Kirehe", "Ngoma", "Nyagatare", "Rwamagana",
  "Karongi", "Ngororero", "Nyabihu", "Nyamasheke", "Rubavu", "Rusizi", "Rutsiro",
];

function createRTAForm() {
  const form = FormApp.create("Rwanda Tailors Association (RTA) - Membership Registration")
    .setIsQuiz(false)
    .setAllowResponseEdits(false)
    .setLimitOneResponsePerUser(false)
    .setShowLinkToRespondAgain(true)
    .setDescription(
      "Rwanda Tailors Association (RTA) Membership Registration\n" +
      "Ifishi yo Kwiyandikisha mu Ishyirahamwe ry'Abadozi mu Rwanda (RTA)\n\n" +
      "Please choose your preferred language to continue. / Hitamo ururimi ukunda gukoresha kugira ngo ukomeze."
    );

  // --- Page 1: language chooser, branches to the matching section ---
  const langItem = form.addMultipleChoiceItem();
  langItem.setTitle("Choose your language / Hitamo Ururimi").setRequired(true);

  // IMPORTANT: each page break must be immediately followed by that page's own
  // questions before the next page break is added. Items are appended to the
  // form in a flat sequence, so creating both page breaks up front (before
  // adding any questions) would dump every question onto the same page.
  const enBreak = form.addPageBreakItem().setTitle("RTA Membership Registration Form");
  buildEnglishSection(form);
  // After finishing the English section, skip straight to submit
  // instead of falling through into the Kinyarwanda section.
  enBreak.setGoToPage(FormApp.PageNavigationType.SUBMIT);

  const rwBreak = form.addPageBreakItem().setTitle("Ifishi yo Kwiyandikisha muri RTA");
  buildKinyarwandaSection(form);
  // Kinyarwanda is the last section, so it submits automatically.

  langItem.setChoices([
    langItem.createChoice("English", enBreak),
    langItem.createChoice("Kinyarwanda", rwBreak),
  ]);

  form.setConfirmationMessage(
    "Thank you for registering with RTA! Our team will contact you shortly.\n" +
    "Murakoze kwiyandikisha muri RTA! Itsinda ryacu rizabahamagara vuba."
  );

  // Collect every response in a dedicated spreadsheet.
  const sheet = SpreadsheetApp.create("RTA Membership Registration - Responses");
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  // Email NOTIFY_EMAIL automatically on every submission.
  ScriptApp.newTrigger("onRTAFormSubmit").forForm(form).onFormSubmit().create();

  Logger.log("Form URL (share this on the website): " + form.getPublishedUrl());
  Logger.log("Form edit URL (for RTA staff only): " + form.getEditUrl());
  Logger.log("Responses spreadsheet: " + sheet.getUrl());
}

function buildEnglishSection(form) {
  form
    .addSectionHeaderItem()
    .setTitle("RTA Membership Registration Form")
    .setHelpText("Please fill in your details accurately. Required fields are marked.");

  form.addTextItem().setTitle("1. Full Name").setRequired(true);

  form
    .addTextItem()
    .setTitle("2. Phone Number")
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireTextMatchesPattern("^[0-9+ ]{9,15}$")
        .setHelpText("Enter a valid phone number, e.g. 07XXXXXXXX")
        .build()
    );

  form
    .addTextItem()
    .setTitle("3. Email Address (Optional)")
    .setRequired(false)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());

  form.addMultipleChoiceItem().setTitle("4. Gender").setRequired(true).setChoiceValues(["Male", "Female"]);

  form
    .addTextItem()
    .setTitle("5. National ID Number")
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireTextMatchesPattern("^[0-9]{16}$")
        .setHelpText("Enter your 16-digit National ID number")
        .build()
    );

  form.addListItem().setTitle("6. Province").setRequired(true).setChoiceValues(PROVINCES_EN);

  form.addListItem().setTitle("7. District").setRequired(true).setChoiceValues(DISTRICTS);

  form
    .addTextItem()
    .setTitle("8. Business Name")
    .setRequired(false)
    .setHelpText("Leave blank or write 'N/A' if not applicable");

  form
    .addMultipleChoiceItem()
    .setTitle("9. Membership Category")
    .setRequired(true)
    .setChoiceValues(["Individual", "Cooperative", "Company"]);

  form.addParagraphTextItem().setTitle("10. Main Products/Services").setRequired(true);

  form
    .addTextItem()
    .setTitle("11. Number of Employees")
    .setRequired(true)
    .setValidation(FormApp.createTextValidation().requireWholeNumber().build());

  form
    .addParagraphTextItem()
    .setTitle("12. Training Needs")
    .setRequired(false)
    .setHelpText("What training would you like RTA to provide?");

  const support = form.addCheckboxItem();
  support.setTitle("13. Business Support Needed").setRequired(true);
  support.setChoiceValues(["Finance", "Market Access", "Equipment", "Training"]);
  support.showOtherOption(true);

  const declaration = form.addCheckboxItem();
  declaration.setTitle("14. Declaration").setRequired(true);
  declaration.setChoiceValues(["I confirm that the information provided is true."]);
}

function buildKinyarwandaSection(form) {
  form
    .addSectionHeaderItem()
    .setTitle("Ifishi yo Kwiyandikisha muri RTA")
    .setHelpText("Uzuza amakuru yawe neza. Ibisabwa ni ngombwa kuzuzwa byose.");

  form.addTextItem().setTitle("1. Amazina yombi").setRequired(true);

  form
    .addTextItem()
    .setTitle("2. Nimero ya Telefoni")
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireTextMatchesPattern("^[0-9+ ]{9,15}$")
        .setHelpText("Andika nimero ya telefoni nyayo, urugero 07XXXXXXXX")
        .build()
    );

  form
    .addTextItem()
    .setTitle("3. Imeri (si ngombwa)")
    .setRequired(false)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());

  form.addMultipleChoiceItem().setTitle("4. Igitsina").setRequired(true).setChoiceValues(["Gabo", "Gore"]);

  form
    .addTextItem()
    .setTitle("5. Nimero y'Indangamuntu")
    .setRequired(true)
    .setValidation(
      FormApp.createTextValidation()
        .requireTextMatchesPattern("^[0-9]{16}$")
        .setHelpText("Andika nimero yawe y'indangamuntu ifite imibare 16")
        .build()
    );

  form.addListItem().setTitle("6. Intara").setRequired(true).setChoiceValues(PROVINCES_RW);

  form.addListItem().setTitle("7. Akarere").setRequired(true).setChoiceValues(DISTRICTS);

  form
    .addTextItem()
    .setTitle("8. Izina ry'ubudozi cyangwa rya sosiyete")
    .setRequired(false)
    .setHelpText("Reka ubusa cyangwa wandike 'N/A' niba bidakwiye");

  form
    .addMultipleChoiceItem()
    .setTitle("9. Icyiciro cy'ubunyamuryango")
    .setRequired(true)
    .setChoiceValues(["Umudozi ku giti cye", "Koperative", "Sosiyete"]);

  form.addParagraphTextItem().setTitle("10. Ibikorwa cyangwa ibicuruzwa ukora").setRequired(true);

  form
    .addTextItem()
    .setTitle("11. Umubare w'abakozi")
    .setRequired(true)
    .setValidation(FormApp.createTextValidation().requireWholeNumber().build());

  form
    .addParagraphTextItem()
    .setTitle("12. Amahugurwa wifuza")
    .setRequired(false)
    .setHelpText("Ni ayahe mahugurwa wifuza ko RTA itanga?");

  const support = form.addCheckboxItem();
  support.setTitle("13. Ubufasha ukeneye").setRequired(true);
  support.setChoiceValues(["Inguzanyo/Igishoro", "Isoko", "Ibikoresho", "Amahugurwa"]);
  support.showOtherOption(true);

  const declaration = form.addCheckboxItem();
  declaration.setTitle("14. Icyemezo").setRequired(true);
  declaration.setChoiceValues(["Ndemeza ko amakuru ntanze ari ukuri."]);
}

/**
 * Fires automatically on every submission (trigger created in createRTAForm).
 * Emails the full response to NOTIFY_EMAIL — do not run this manually.
 */
function onRTAFormSubmit(e) {
  const responses = e.response.getItemResponses();
  let body = "A new RTA membership registration was submitted.\n\n";
  responses.forEach(function (r) {
    body += r.getItem().getTitle() + ": " + r.getResponse() + "\n";
  });
  body += "\nSubmitted at: " + new Date();

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "New RTA Membership Registration",
    body: body,
  });
}
