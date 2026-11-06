# Phone Scout

[Live dashboard](https://induwarauthsara.github.io/phone-scout/) · [Public repository](https://github.com/induwarauthsara/phone-scout)

GitHub Pages serves the root of `main`. The 8:00 a.m. Codex search currently updates
the local dashboard only. The public site changes when a reviewed update is published.

Open **index.html** in a browser. The dashboard includes Store offers, Facebook finds, Finder & compare,
Phone targets, Instructions and Activity. No installation or internet is required to view saved data.

## Data files

- `data/profile.json`: budget, preferences, schedule display and update timestamps.
- `data/search.json`: target model records and personal requirements.
- `data/instructions.json`: daily workflow and verification rules.
- `data/offers.json`: `active` live listings with honest availability labels and separate historical records.
- `data/logs.json`: append-only structured activity entries and preserved original logs.
- `data/finder.json`: editable GSMArena Phone Finder link used by the next daily run.
- `data/catalog.json`: the last captured finder list, compared specifications and positive stock checks.

These JSON files are authoritative. Original TXT files are frozen migration backups.
`originalText` fields preserve legacy text for reference; structured fields take precedence.
Do not run `migrate-data.mjs` again; it intentionally refuses to overwrite migrated data.

After editing data, run `node build-data.mjs`. It validates the JSON and creates
`data.js`, the browser-readable bundle for double-click opening. Do not edit the
generated bundle or hardcode offers into HTML/JavaScript. Click Refresh data in
the page after rebuilding. Update `profile.updatedAt` when data changes, but only
change stock timestamps after a real stock check.

Optional live mode: `node serve.mjs`, then visit http://127.0.0.1:8787.
Live mode reads the JSON directly on refresh and checks for changes every minute
when no search field or expanded details are in use. The schedule runs in Codex,
not in the webpage; opening the page does not start a search.

## Daily finder catalog

Change the link in **Finder & compare → Change the daily GSMArena link**. To save it directly,
open the local dashboard at `http://127.0.0.1:8787/#catalog` with `node serve.mjs` running.
On the hosted or offline page, download the settings and replace `data/finder.json` in
this workspace. The next scheduled run uses the saved link. The current snapshot retains
its original source and check time until the next capture.

At 8:00 a.m. Asia/Colombo, read `data/finder.json` and validate its link using
`normalizeFinderUrl` from `finder-config.mjs`. Open the actual finder results, record
the reported count and every visible model ID, and inspect each phone's specification
page. Record truncated or blocked coverage. On total source failure, keep the last valid
model snapshot without changing its source or check date. Never interpret a blocked
page as zero results.

For each model search Google for “phone name Price in Sri Lanka” and search live ikman,
Colombo Facebook Marketplace and popular Sri Lankan shops. Open each promising exact
listing. Require positive stock wording for that variant, seller, location and advertised
LKR price. Order buttons, an active ad, aggregator prices and other variants' stock badges
do not count. Log blocked searches and exclude import-only or out-of-area offers. Do not
message sellers, reserve, add to cart or purchase.

Replace the current offers in `data/catalog.json` with offers verified in that run. Match
offers by GSMArena model ID and exact regional phone. Preserve variant and condition;
record stock wording and time in `stock`, price in `priceLkr` and its label in
`priceEvidence`. Include an advertised KOKO total only if supported by evidence. Verified
over-budget prices can appear in Finder as reference only. Remove unverified rechecks
from the Finder and log why. The Finder also hides stock checks older than 36 hours.
The existing Store shortlist and Facebook history retain their own rules.

Append a dated Activity entry with queries, findings and coverage. Run `node build-data.mjs`
to refresh the local dashboard. Keep unknown specs unknown, and do not treat camera
specs or display type as evidence of better photos or a lower failure rate.

## Active offer format

Each active record needs `id`, `rank`, `name`, `seller`, `storage`, `condition`,
`cashPrice` (number), `url`, and `stock: {status: "not_stated", checkedAt: ISO date,
evidence: "exact availability wording"}`. Optional fields: `koko` with `total`,
`reason`, `address`, `warranty`, `displayCoverage`, `testing`, `variant`,
`batteryHealth`. Save explicit unknown values honestly. Actual stock freshness
must be verified each run; the build validator checks shape, not the seller.

Logs have `id`, `timestamp`, `type`, `title`, `body`, and `source`. Add new entries
without modifying existing ones. Explicit sold-out/out-of-area offers belong in logs/history, never
in the current shortlist. Keep source evidence and previous prices.

Availability status can be in_stock, low_stock, not_stated or check_failed. Missing a stock badge is not a removal reason. Recheck all listed offers every run; retain blocked existing entries with a stale warning. KOKO: supported=true only with explicit product or merchant evidence (scope labelled), null=not stated, false=explicitly not supported. Store monthly, total, evidence, source and checkedAt. Log every search query and finding, including rejected results, in queries[] and findings[] plus readable body.

## Facebook research

`data/offers.json` also contains `facebook.items` (inspected ads), `facebook.results`
(all encountered cards), `facebook.queries` and `facebook.riskNotes` with source links.
The linked Facebook finds view filters area, asking price, KOKO, warranty and assessment.
These research leads include rejected and over-budget ads, clearly labelled; they are
separate from the active store shortlist. Seller warranty and condition claims remain
unverified until the specific handset, invoice and local cover are checked.
