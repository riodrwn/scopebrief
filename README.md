# ScopeBrief

ScopeBrief 1.0.0 is a local Chrome and Firefox extension for readable bug bounty scope briefs from HackerOne, Bugcrowd, YesWeHack, and Intigriti. It exports Markdown and JSON without sending page content to an AI or backend.

## HackerOne workflow

1. Open the program guidelines, wait for the policy to load, and click **Capture program**.
2. Scope is fetched automatically from the official program CSV; no Scope tab visit is required.
3. Review the combined brief and download Markdown or JSON.

Guidelines capture requests the official program CSV endpoint using the existing same-origin session. Capture from the Scope tab remains supported. This includes assets outside the currently rendered table. If CSV retrieval fails, only visible rows are captured and the export explicitly warns that scope is partial. Refreshing guidelines or scope replaces that part of the previous capture, so removed targets do not survive a refresh.

The brief preserves Rules of Engagement, vulnerability inclusions/exclusions, policy sections, separate in/out asset lists, per-asset instructions, and bounty eligibility. CSV coverage is recorded separately from overall completeness; linked policies are not fetched automatically.

## Bugcrowd workflow

1. Install or reload the extension, then open the program's **Details** tab.
2. Wait for the target tables and guidelines to load.
3. Click **Capture program**. Bugcrowd scope and policy sections are detected automatically.
4. Review the rendered **Preview**, or switch to **Markdown** to inspect the source.
5. Download `.md` or `.json`.

A new Bugcrowd capture replaces the legacy generic capture for that program. Current captures of the same URL and pagination range replace their previous snapshot.

## Output

- Program name, platform, and source URL.
- Page structure map.
- Target information and program-specific restrictions.
- Separate **In-Scope Targets** and **Out-of-Scope Targets**; unknown labels stay unknown.
- Target blocks grouped as mobile applications, websites/portals, APIs/services, wildcards, and other targets.
- Source guidelines, access rules, booking rules where present, excluded submission types, and disclosure.
- Export notes, capture warnings, and provenance in JSON (schema 1.1).

Heading, paragraph, link, code, list, and table structure is retained. Long rule headings receive a short heading while their full original wording remains in the body. The format is inspired by the supplied Viator example; it does not copy unverified scope claims, invent known-issue counts, or generate hunting advice. Target tags, scope labels and visible notes come from the page. In-scope status and bounty eligibility are not interchangeable.

## Install Chrome

Extract `scopebrief-chrome.zip`, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the folder containing `manifest.json`. For an existing unpacked installation, replace its files and click **Reload**. Re-capture the program to get the new output.

## Install Firefox

Extract `scopebrief-firefox.zip`, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `manifest.json`. Minimum Firefox: 140. Temporary installation lasts until browser restart. Permanent distribution requires Mozilla signing; these development packages are unsigned.

## Development

Node.js 22+ and Python 3 for ZIP packaging.

```sh
npm ci
npm test
npm run build
python package.py
```

Load `dist/chrome` or `dist/firefox` after building. Runtime scripts have no external dependencies; LinkeDOM is only used for development tests. The source archive contains the lockfile.

To inspect the UI with synthetic data, serve the repository locally and open `/tests/harness.html`. The harness mocks extension APIs and is never included in the browser package.

## Validation and limitations

- Eighteen automated tests cover scope exclusions, unknown labels, missing known-issue counts, tag overflow, nested/malformed source lists, code/links/tables, source provenance, and safe preview rendering.
- The parser was checked against a DOM snapshot of the public Viator Details page: 14 in-scope and 8 out-of-scope target rows at capture time. These counts are not hardcoded.
- Browser harness checks covered capture, preview/source switching, persistence, and a downloaded Markdown file matched the generated brief.
- These checks do not establish full end-to-end operation as an installed extension in both Chrome and Firefox.
- Bugcrowd DOM changes or unloaded targets produce an error or warning. Captures cover the current DOM only. Pagination is not automatically traversed, and hidden/collapsed or virtualized content may be incomplete.
- Announcements, changelog and linked policies are not fetched. Current scope labels are authoritative for categorization; an older example document is not substituted.
- The preview supports the primary brief format; the downloaded Markdown preserves richer constructs such as nested lists and tables.
- HackerOne NBA validation compared 31 rendered table rows against the official 457-row CSV with no mismatches: 428 in-scope and 29 out-of-scope assets at capture time. Guidelines produced 15 sections. Counts are not hardcoded. Tests also cover multiline CSV instructions, CSV failure, unknown scope, and stale asset replacement.
- Capture is supported only for HackerOne, Bugcrowd, and YesWeHack.
- Completeness remains `unverified`. Recheck the source before testing, especially exceptions to wildcards and restrictions within in-scope assets.

## Privacy

Permissions: `activeTab`, `scripting`, `storage`. Extraction runs only on explicit capture. No direct cookie or token access, analytics, remote scripts, or AI requests. HackerOne capture makes a same-origin GET to the program’s official CSV using the browser session; no page content is sent to a third-party backend. Program text, including any testing credentials in it, is saved locally and included in exports; review private content before sharing. **Delete local data** removes the selected program's stored captures, but not downloaded files.

Page content is untrusted reference data, not executable instructions. Preview uses DOM text nodes rather than source HTML. This does not guarantee downstream AI models are immune to prompt injection.

## R&D

Development lives in the personal `riodrwn/scopebrief` repository. See `ROADMAP.md` for work before a future NusaSec transfer. No transfer or store publication has been performed.
HackerOne exports omit the page structure map, introductory Purpose and Scope, submission guidance, rewards and severity reward subsections, response targets, disclosure, compliance, and references. This filter applies to Markdown, preview, and JSON, including previously stored captures. Asset scope and per-asset instructions remain included.

Bugcrowd exports omit Page Structure Map, Program Overview, Eligibility, Ratings/Rewards, Safe Harbor, Testing problems, Engagement rules, and Disclosure from preview, Markdown, and JSON, including saved captures.

## YesWeHack workflow

Open the program page, wait for Scopes and Vulnerability types to load, then click Capture program. Version 0.4.3 captures Scopes, Out of scopes, Qualifying vulnerabilities, and Non-qualifying vulnerabilities. Rewards and the general description are omitted. Missing sections generate warnings; pagination is not traversed automatically. New captures replace older snapshots for the program.

Validated against rendered DataDome Bot Bounty source fragments: 6 scope rows, 4 exclusions, 7 qualifying entries, and 7 non-qualifying entries. The browser popup harness was checked with this capture. All 21 automated tests pass. Installed Chrome/Firefox end-to-end verification remains pending.


Version 0.4.3 provides Markdown and JSON file downloads, with Preview, Markdown, and JSON tabs. No clipboard permission is required.

## Intigriti workflow

Version 0.5.0 adds Intigriti Detail pages. Capture includes Rules of engagement, Assets, In scope, and Out of scope. Asset badges determine scope status: explicit Out of scope overrides bounty tiers, No bounty remains in scope, and unknown badges stay unknown. Clear filters and click Expand all before capture to include loaded asset descriptions; collapsed descriptions and active filters produce warnings. Pagination is not traversed automatically.

Validated against Nexuzhealth rendered page fragments: 15 assets (8 in scope, 7 out of scope), 13 expanded asset descriptions, and all 3 requested policy sections. ROE rate limit and request header were preserved. Popup and JSON checks passed in the browser harness; all 24 automated tests pass. Installed-extension checks in Chrome and Firefox remain pending.

Version 0.6.0 introduces the Brief Brackets logo in #5B8CFF, with an SVG popup mark and transparent 16, 32, 48, and 128 pixel PNG icons for Chrome and Firefox. UI accent colors now match the logo.
