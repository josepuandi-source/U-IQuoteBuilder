/* ============================================================
   U&I Quote Builder — editable settings
   ------------------------------------------------------------
   This is the file to change when fees, rates or wording change.
   Amounts are strings so you can type them the way they appear
   on a quote ("2,078.70"). Commas and $ signs are fine.

   IMPORTANT: when you change any value under `settings`, also
   change `version` (today's date is easiest). That pushes the new
   defaults to every staff browser. Without it, staff who already
   used the tool keep their old saved values.
   ============================================================ */
window.QUOTE_CONFIG = {
  version: "2026-11-05",

  org: "U&I Global",

  /* Defaults shown under "Rates and standard fees". Staff can
     override these in their own browser. */
  settings: {
    rate: "44",                 // AUD -> PHP conversion
    visa: "2,078.70",           // Student visa (subclass 500)
    depVisa: "1,226.72",        // Dependant (partner) visa
    sssf: "660",                // Student Support Services Fee, single
    sssfDep: "770",             // Student Support Services Fee, with dependant
    living: "29,710",           // Living cost, student, 12 months
    livingDep: "10,394",        // Living cost, partner, 12 months
    booking: "https://calendar.app.google/Rqv2skbG15VDo5PL6"
  },

  /* Fee lines added automatically for each mode. */
  lines: {
    deposit: "Allocated Budget for Tuition Fee Deposit",
    oshc: "Overseas Health Insurance (OSHC) Fee Estimate",
    oshcCouple: "Overseas Health Insurance (OSHC) Fee Estimate (Couple Cover)",
    visa: "Student Visa (Subclass 500 Fee)",
    depVisa: "Dependent Visa Fee",
    sssf: "Student Support Services Fee",
    ielts: "1-MONTH IELTS/PTE REVIEW & MOCK TEST (BOOKING REQUIRED)"
  },

  /* Starting amounts for OSHC and travel cost. */
  oshcSingle: "1,500",
  oshcCouple: "9,114",
  travel: { offshore: "2,000", onshore: "1,000", couple: "4,000" },

  /* Shown under the Student Support Services Fee when the
     breakdown is ticked. The fee is split in half automatically. */
  sssfCovers: [
    "Administrative support",
    "Documentation preparation and assistance",
    "Education counselling and application support",
    "Ongoing student support throughout the enrolment process"
  ],
  sssfFirst: "Payable prior to enrolment",
  sssfSecond: "Payable upon issuance of the Confirmation of Enrolment (CoE)",

  /* Red note under any table that has estimate lines. */
  note: "Please note: The figures in red are estimates only and may differ from the actual amounts stated in the Letter of Offer.",

  /* Email wording. {name}, {options} and {link} are filled in. */
  email: {
    greeting: "Hi {name},",
    intro: "Thank you for your enquiry. Please see below the estimated costs for the course {options} we discussed.",
    closing: "If you'd like to go through {these} together, you can book a free consultation with us here: {link}"
  },

  pdfTitle: "Student Visa Cost Quotation"
};
