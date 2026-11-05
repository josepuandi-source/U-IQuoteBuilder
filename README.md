# U&I Quote Builder

Builds U&I Global student visa cost quotations from a short form. Output pastes straight into Gmail or Outlook as a formatted table, copies as plain text for Messenger or Viber, or downloads as a PDF.

Static site, no build step. Works on Vercel's free plan.

## Deploy to Vercel (first time)

**Option A: GitHub (recommended, every push redeploys)**
1. Create a new GitHub repo and push this folder to it.
2. In Vercel: Add New → Project → import the repo.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
4. Deploy. Share the `*.vercel.app` link with staff.

**Option B: from your computer**
```bash
npx vercel          # preview deploy, answer the prompts
npx vercel --prod   # production deploy
```

## Updating fees and courses

| To change | Edit | Then |
|---|---|---|
| Visa fee, living costs, fallback PHP rate, support fee, booking link | `assets/config.js` → `settings` | Change `version` in the same file to today's date |
| Fee line names, red note, email wording | `assets/config.js` | — |
| Saved courses in the "Load a saved course" menu (for everyone) | `assets/courses.js` | — |

Commit and push (or `npx vercel --prod`). Staff get the update on their next page load.

With Claude Code, open this folder and ask in plain words, e.g. *"Update the student visa fee to 2,000 and bump the version"* or *"Add Griffith Master of Marketing, Gold Coast, 34,000 per year, deposit 17,000"*. `CLAUDE.md` tells it where everything lives.

## Run locally

```bash
npm run dev    # http://localhost:3000
```

## Notes

- The AUD → PHP rate fills in automatically from Wise (backup: European Central Bank) each time the page loads. Untick "Use live Wise rate" to type your own.
- "Save as a course" adds the current option to that person's own menu, in their browser only. To share a course with all staff, add it to `assets/courses.js`.
- Quotes and staff overrides are saved in each person's browser only. Nothing is sent to a server.
- The site is marked noindex so it won't show in search results, but anyone with the link can open it. For a password, turn on Vercel Deployment Protection (paid plans) or keep the link internal.
- The PDF shows "PHP" instead of the ₱ sign because standard PDF fonts don't include it.
