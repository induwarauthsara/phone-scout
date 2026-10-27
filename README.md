# Phone Scout

[Live dashboard](https://induwarauthsara.github.io/phone-scout/) · [Public repository](https://github.com/induwarauthsara/phone-scout)

GitHub Pages serves the root of `main`. The daily Codex search commits and pushes
updated JSON and its generated data bundle. Repository content, preferences and
research logs are public, as approved by the owner. Publication failures are logged.

Open **index.html** in a browser. The five linked views are Store offers, Facebook finds, Phone targets,
Instructions and Activity. No installation or internet is required to view saved data.

## Data files

- `data/profile.json`: budget, preferences, schedule display and update timestamps.
- `data/search.json`: target model records and personal requirements.
- `data/instructions.json`: daily workflow and verification rules.
- `data/offers.json`: `active` live listings with honest availability labels and separate historical records.
- `data/logs.json`: append-only structured activity entries and preserved original logs.

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
