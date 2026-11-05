/* ============================================================
   U&I Quote Builder — saved courses
   ------------------------------------------------------------
   Each entry appears in the "Load a saved course" menu and fills
   the current option in one click. Staff can still edit anything
   after loading.

   Fields (all optional except name):
     name        Menu label staff see, e.g. "SCU · MBA · Gold Coast"
     mode        "OFFSHORE" or "ONSHORE"
     school, course, campus, duration, intake
     tuition     List of fee rows: { label, amount }
                 Negative amount = scholarship, e.g. "-23,568"
     deposit     Allocated budget for tuition fee deposit
     oshc        OSHC estimate (single cover)
     pfcTuition  12-month tuition for Proof of Financial Capacity.
                 Leave out to hide that table.

   Starting entries were copied from the PH Team Quotation
   Computation Template (2026/2027 rows). Check each against the
   current Letter of Offer or provider price list before use.
   ============================================================ */
window.QUOTE_COURSES = [
  {
    name: "SCU · Master of Business Administration · Gold Coast",
    mode: "OFFSHORE",
    school: "Southern Cross University",
    course: "Master of Business Administration",
    campus: "Gold Coast",
    duration: "2 years",
    intake: "2027",
    tuition: [{ label: "Master of Business Administration (Total)", amount: "52,000" }],
    deposit: "13,000",
    oshc: "1,400",
    pfcTuition: "26,000"
  },
  {
    name: "SCU · Bachelor of Nursing · Gold Coast / Lismore / Coffs Harbour",
    mode: "OFFSHORE",
    school: "Southern Cross University",
    course: "Bachelor of Nursing",
    campus: "Coffs Harbour, Gold Coast, Lismore",
    duration: "3 years",
    intake: "January, March, June 2027",
    tuition: [{ label: "SCU - Bachelor of Nursing Tuition Fee (Annual)", amount: "27,000" }],
    deposit: "13,500",
    oshc: "1,800",
    pfcTuition: "27,000"
  },
  {
    name: "UniSQ · Bachelor of Nursing · Ipswich / Toowoomba",
    mode: "OFFSHORE",
    school: "University of Southern Queensland",
    course: "Bachelor of Nursing",
    campus: "Ipswich / Toowoomba",
    duration: "3.3 years",
    intake: "February, June, September 2027",
    tuition: [{ label: "UniSQ - Bachelor of Nursing Tuition Fee (Annual)", amount: "34,280" }],
    deposit: "17,140",
    oshc: "1,730",
    pfcTuition: "34,280"
  },
  {
    name: "Greystone · Bachelor of Business · Brisbane",
    mode: "OFFSHORE",
    school: "Greystone Institute",
    course: "Bachelor of Business",
    campus: "Brisbane",
    duration: "3 years",
    intake: "January 2027",
    tuition: [{ label: "Bachelor of Business (Total)", amount: "39,000" }],
    deposit: "1,500",
    oshc: "2,000",
    pfcTuition: "19,500"
  },
  {
    name: "Kaplan · Master of Business Administration · Brisbane",
    mode: "OFFSHORE",
    school: "Kaplan Business School",
    course: "Master of Business Administration",
    campus: "Brisbane",
    duration: "2 years",
    intake: "",
    tuition: [{ label: "Kaplan - MBA Tuition Fee (Total)", amount: "58,920" }],
    deposit: "2,500",
    oshc: "2,497.81",
    pfcTuition: "29,460"
  },
  {
    name: "SSBT + Torrens · Hospitality Management package · Brisbane",
    mode: "OFFSHORE",
    school: "SSBT + Torrens University",
    course: "Hospitality Management (VET + Bachelor package)",
    campus: "Brisbane City",
    duration: "3.5 years",
    intake: "February 2027",
    tuition: [
      { label: "Adv. Dip. of Hospitality Management - 2 yrs", amount: "22,400" },
      { label: "Bachelor of Business - Hospitality Management - 1.5 yrs", amount: "43,440" }
    ],
    deposit: "5,000",
    oshc: "1,500"
  },
  {
    name: "QAT · Cert III Individual Support + Cert IV Ageing + Dip Community Services · Brisbane",
    mode: "OFFSHORE",
    school: "Queensland Academy of Technology",
    course: "Certificate III in Individual Support + Cert IV Ageing Support and Diploma of Community Services",
    campus: "Brisbane",
    duration: "142 weeks",
    intake: "",
    tuition: [
      { label: "Certificate III in Individual Support", amount: "6,000" },
      { label: "Certificate IV in Ageing Support", amount: "7,000" },
      { label: "Diploma of Community Services", amount: "15,000" }
    ],
    deposit: "3,500",
    oshc: "1,941.20"
  }
];
