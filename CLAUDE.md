# U&I Quote Builder

Internal web tool for U&I Global staff. Staff enter a course and its fees, and the tool produces a student visa cost quotation they can paste into an email (formatted table), copy as plain text (Messenger/Viber), or download as a PDF. It replaces copying blocks around the "U&I PH Team – Quotation Computation Template" Google Sheet.

Static site. No framework, no build step. The only server code is `api/rate.js`, a Vercel function that returns the live AUD→PHP rate. Deployed on Vercel (Framework preset: Other).

## Files

| File | What it holds | Who edits it |
|---|---|---|
| `assets/config.js` | Rates, standard fees, fee line labels, red estimate note, email wording, PDF title, `version` | Most common edit |
| `assets/courses.js` | Saved courses for the "Load a saved course" menu | Second most common edit |
| `assets/app.js` | All logic: state, form rendering, totals, email HTML, plain text, PDF | Only for behaviour changes |
| `assets/styles.css` | U&I brand styles (teal #009C91 / #007D74 on cream #FFFDFA, Kanit + IBM Plex Sans, Yellowtail script for "Global") | Visual changes |
| `index.html` | Page shell; loads CDN libs then config → courses → app, in that order | Rarely |
| `api/rate.js` | Live AUD→PHP rate: Wise (`wise.com/rates/live`, undocumented) first, ECB via Frankfurter as backup, cached 1 hour at Vercel's edge. The page falls back to calling Frankfurter directly when `/api/rate` is missing (local preview) | Only if Wise changes |
| `vercel.json` | noindex + no-cache headers on `/assets` so config edits reach staff on next load | Rarely |

## Common tasks

**Exchange rate**
Filled from the live Wise rate on each page load ("Use live Wise rate", on by default; `liveRate` in `config.js`). Staff can untick it and type their own. `settings.rate` is only the fallback.

**Fee or rate changed (visa fee, living cost, support fee)**
1. Edit the value in `assets/config.js` under `settings`.
2. Change `version` in the same file to today's date. Without this, staff who have used the tool keep their old saved values (settings are stored per browser in localStorage and only reset when `version` changes).

**Add or update a saved course**
Add an object to `window.QUOTE_COURSES` in `assets/courses.js`. Fields are documented at the top of that file. Amounts are strings like `"26,000"`. Negative amounts are scholarships. Omit `pfcTuition` to leave the Proof of Financial Capacity table off.

Staff can also click "Save as a course" to keep the current option in their own menu. Those live only in that browser (localStorage key `uiq-my-courses-v1`, same shape as `courses.js` entries) and show under "My saved courses". To share one with everyone, add it to `courses.js`.

**Change email wording**
Edit `email` in `assets/config.js`. Placeholders: `{name}`, `{options}` (option/options), `{these}` (this option/these options), `{link}` (booking link).

## How app.js is organised

- `presetItems` / `applyPreset` — default fee lines per mode (OFFSHORE, ONSHORE, with dependant). Mode changes keep the deposit, OSHC and any custom lines staff added.
- `rowsFor(option)` — builds one row model `{k, c:[label, value], est}` per table. **All three outputs (email HTML, plain text, PDF) render from this model.** Change quote content here, not in each renderer.
  - Row kinds: `meta`, `head`, `row`, `sub` (tuition total), `section`, `total`, `php`, `note`.
- `tableHTML` — email table. Inline styles only, because Gmail and Outlook strip `<style>` blocks on paste.
- `emailText` — plain-text version.
- `buildPDF` — jsPDF + autoTable. Standard PDF fonts lack the ₱ glyph, so the PDF writes "PHP" instead (`clean()`).
- Amount parsing: `parse()` accepts "2,078.70", "$2,078.70", "-23,568". Anything non-numeric ("FREE", "TBA at Expo", "$290/week") is shown as typed and left out of totals.

## Rules

- Keep it static: no build step, no npm dependencies at runtime. Server code stays limited to `api/rate.js`, and it never receives student data. Libraries load from cdnjs, pinned to exact versions.
- Never store or send student data to a server. Quotes live only in the staff member's browser (localStorage keys `uiq-builder-v1` and `uiq-my-courses-v1`).
- Estimate lines must stay red (#c00000) in email and PDF; the footer note promises that.
- Keep `config.js` and `courses.js` readable for non-developers: plain values, comments in plain English.
- Australian English in UI copy.

## Run and test locally

```bash
npm run dev        # serves on http://localhost:3000
```

Quick checks after a change:
1. Load a saved course, switch OFFSHORE ↔ ONSHORE and tick "With dependant": fee lines and totals should update.
2. Copy for email, paste into a Gmail draft: table keeps colours, estimate lines are red.
3. Download PDF: opens, totals match the preview.
4. Width ~400px: no sideways scrolling.

## Deploy

Push to the connected GitHub repo, or run `npx vercel --prod` from this folder. Vercel settings: Framework "Other", no build command, output directory = root.
