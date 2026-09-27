# ScopeBrief 1.0.0

A Chrome and Firefox extension that captures selected bug bounty scopes and program rules for research and AI-agent context. Review Preview, Markdown, or JSON, then download a local file.

[Downloads](https://github.com/riodrwn/scopebrief/releases/tag/v1.0.0) · [Privacy policy](https://riodrwn.github.io/scopebrief/privacy/) · [Support](https://github.com/riodrwn/scopebrief/issues)

## Supported platforms

| Platform | Workflow | Included content |
| --- | --- | --- |
| HackerOne | Capture Program guidelines; official scope CSV is fetched automatically | Selected rules, vulnerability inclusions/exclusions, asset scope and instructions |
| Bugcrowd | Capture Details | Target information, in/out targets, selected testing guidelines |
| YesWeHack | Capture the program page | Scopes, Out of scopes, qualifying/non-qualifying vulnerabilities |
| Intigriti | Open Detail, clear filters and expand asset details, then capture | Rules of engagement, assets with scope status, In scope, Out of scope |

Scope and bounty eligibility are separate. Unknown labels remain unknown. Only selected sections are included; page structure maps, unrelated summaries, and reward descriptions are omitted.

## Install

**Chrome:** extract scopebrief-chrome.zip, open chrome://extensions, enable Developer mode, choose Load unpacked, and select the folder containing manifest.json. Replace files and Reload to update.

**Firefox:** extract scopebrief-firefox.zip, open about:debugging#/runtime/this-firefox, choose Load Temporary Add-on, and select manifest.json. Requires Firefox 140+. This unsigned installation lasts until restart; permanent distribution requires Mozilla signing.

GitHub release packages are not a Chrome Web Store or Mozilla Add-ons approval.

## Privacy

Capture runs on your click. Program text, source URLs, titles, and timestamps are stored locally. Text may include contact information or testing credentials and is not automatically redacted. Delete local data removes the selected saved program; downloaded files must be deleted separately.

Permissions: activeTab, scripting, storage. No analytics, remote code, developer backend, cloud sync, or automatic AI uploads. HackerOne capture requests its official CSV over HTTPS using the existing browser session. [Read the full privacy policy](https://riodrwn.github.io/scopebrief/privacy/).

## Limitations and validation

- 24 automated tests cover parsing, explicit exclusions, unknown labels, CSV failures, stale snapshot replacement, safe preview rendering, and source formatting.
- Source-fragment validation used public NBA, Viator, DataDome, and Nexuzhealth pages. Browser harness checks covered the popup and exports.
- These checks do not establish installed-extension end-to-end coverage for every browser and platform.
- DOM changes, filters, pagination, collapsed sections, and linked policies affect completeness. Only HackerOne uses its official CSV for additional scope retrieval.
- Recheck current rules and authorization before testing. Source content is untrusted reference data, not instructions to an AI agent.
- The extension does not scan targets or perform security testing.

## Development

Requires Node.js 22+ and Python 3 for packaging.

Run npm ci, npm test, npm run build, then python package.py.

Load dist/chrome or dist/firefox. Runtime scripts have no external dependencies; LinkeDOM is a development dependency. Serve the project locally and open /tests/harness.html for the synthetic popup harness.

## Author

© [riodrwn](https://github.com/riodrwn). Independent project; not affiliated with the supported platforms. No NusaSec transfer has been performed.
