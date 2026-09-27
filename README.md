<div align="center">
  <img src="src/logo.svg" alt="ScopeBrief logo" width="100" height="100">
  <h1>ScopeBrief</h1>
  <p><strong>Bug bounty scope. Clear rules. AI-ready context.</strong></p>
  <p>Capture selected program rules and asset scopes.<br>Review locally. Export Markdown or JSON. Bring the context to your AI agent.</p>

  <p>
    <a href="https://github.com/riodrwn/scopebrief/releases/tag/v1.0.0"><img src="https://img.shields.io/badge/release-v1.0.0-5B8CFF?style=flat-square" alt="Release v1.0.0"></a>
    <img src="https://img.shields.io/badge/Chrome-Manifest_V3-5B8CFF?style=flat-square" alt="Chrome Manifest V3">
    <img src="https://img.shields.io/badge/Firefox-140%2B-5B8CFF?style=flat-square" alt="Firefox 140 or newer">
    <img src="https://img.shields.io/badge/exports-Markdown_%2B_JSON-5B8CFF?style=flat-square" alt="Markdown and JSON exports">
  </p>

  <p>
    <a href="https://github.com/riodrwn/scopebrief/releases/download/v1.0.0/scopebrief-chrome.zip"><strong>Download for Chrome</strong></a>
    &nbsp; · &nbsp;
    <a href="https://github.com/riodrwn/scopebrief/releases/download/v1.0.0/scopebrief-firefox.zip"><strong>Download for Firefox</strong></a>
  </p>
  <p>
    <a href="https://riodrwn.github.io/scopebrief/">Website</a> ·
    <a href="https://riodrwn.github.io/scopebrief/privacy/">Privacy</a> ·
    <a href="CHANGELOG.md">Changelog</a> ·
    <a href="https://github.com/riodrwn/scopebrief/issues">Report an issue</a>
  </p>
</div>

---

## From program page to research context

ScopeBrief turns selected content from bug bounty program pages into a readable brief. It keeps asset scope labels, vulnerability exclusions, and testing instructions together so you can review the context before using it in your workflow.

| Capture | Review | Export |
| :--- | :--- | :--- |
| Open a supported program and click **Capture program**. | Inspect **Preview**, **Markdown**, or **JSON**. | Download a file for your notes or AI agent. |

- **Focused output** — selected rules and scope sections, without reward tables or unrelated page content.
- **Explicit scope status** — in scope, out of scope, and unknown remain distinct. No bounty does not mean out of scope.
- **Local saved captures** — reopen a program brief or remove it with **Delete local data**.
- **Source context** — exports include source URLs, capture timestamps, and capture warnings.
- **No automatic AI uploads** — you decide where downloaded files go.

## Supported platforms

| Platform | Where to capture | What is included |
| :--- | :--- | :--- |
| **HackerOne** | Program guidelines | Selected rules and vulnerability inclusions/exclusions. The official scope CSV is fetched automatically, including asset instructions where provided. |
| **Bugcrowd** | Details | Target information, in-scope and out-of-scope targets, and selected testing guidelines. |
| **YesWeHack** | Program page | Scopes, Out of scopes, qualifying vulnerabilities, and non-qualifying vulnerabilities. |
| **Intigriti** | Detail | Rules of engagement, assets with scope status, In scope, and Out of scope. Clear filters and use **Expand all** to include asset descriptions. |

> ScopeBrief exports selected sections, not the complete program policy. Always verify current rules, exclusions, and authorization on the original platform before testing.

## Installation

Download the ZIP for your browser from the [v1.0.0 release](https://github.com/riodrwn/scopebrief/releases/tag/v1.0.0), then follow the steps below.

<details open>
<summary><strong>Chrome — load unpacked</strong></summary>

1. Extract **scopebrief-chrome.zip** into a folder you will keep.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Pin ScopeBrief to the toolbar and open a supported program page.

To update, replace the extension files and click **Reload** on its extension card.

</details>

<details>
<summary><strong>Firefox — temporary installation</strong></summary>

1. Extract **scopebrief-firefox.zip**.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** and select `manifest.json`.
4. Open a supported program page and launch ScopeBrief.

Requires **Firefox 140+**. Temporary installation lasts until browser restart. Permanent distribution requires Mozilla signing.

</details>

These GitHub packages are development-installable builds. A GitHub release does not indicate Chrome Web Store or Mozilla Add-ons approval.

## Privacy by design

Capture starts when you click **Capture program**. The extension stores captured content in local browser extension storage and creates downloads only when requested.

| Permission | Purpose |
| :--- | :--- |
| `activeTab` | Access the program tab you invoke the extension on. |
| `scripting` | Run bundled platform parsers after you request a capture. |
| `storage` | Keep saved program captures locally. |

No analytics, developer backend, cloud sync, or remote executable code. HackerOne capture requests its official CSV over HTTPS using your existing browser session.

Program text can contain contact information or testing credentials; ScopeBrief does not automatically redact it. **Delete local data** removes the selected saved program, while downloaded files must be deleted separately.

**[Read the privacy policy →](https://riodrwn.github.io/scopebrief/privacy/)**

## Accuracy and limitations

- Platform layout changes, active filters, pagination, and collapsed content can affect capture completeness.
- Linked policies are not fetched automatically. HackerOne's official CSV provides additional asset scope coverage.
- Unknown scope labels stay unknown; exports do not grant testing authorization.
- Captured content is untrusted reference material, not instructions to an AI agent.
- ScopeBrief does not scan targets or perform security testing.

**Validation:** 24 automated tests cover parsing, explicit exclusions, unknown labels, CSV failures, snapshot replacement, safe preview rendering, and source formatting. Public source-fragment checks used NBA, Viator, DataDome, and Nexuzhealth; browser harness checks covered previews and exports. This does not establish installed-extension end-to-end coverage for every browser and platform.

## Development

Requires **Node.js 22+** and **Python 3** for ZIP packaging.

```sh
git clone https://github.com/riodrwn/scopebrief.git
cd scopebrief
npm ci
npm test
npm run build
python package.py
```

| Path | Contents |
| :--- | :--- |
| `src/` | Popup, platform parsers, formatters, and icons |
| `tests/` | Automated tests and a synthetic browser harness |
| `docs/` | GitHub Pages website and privacy policy |
| `dist/chrome/` | Generated Chrome build |
| `dist/firefox/` | Generated Firefox build |

Load a generated build using the installation steps above. To inspect the synthetic popup harness, serve the repository locally and open `/tests/harness.html`. Runtime scripts have no external dependencies; LinkeDOM is used only for development tests.

## Feedback

Found a parsing issue? [Open an issue](https://github.com/riodrwn/scopebrief/issues) with the platform, browser version, and a minimal sanitized example. Do not post private program details, credentials, or sensitive exports.

See the [roadmap](ROADMAP.md) for planned improvements.

---

<div align="center">
  <img src="src/logo.svg" alt="" width="28" height="28">
  <p>© <a href="https://github.com/riodrwn"><strong>riodrwn</strong></a></p>
  <sub>Independent project. Not affiliated with or endorsed by the supported platforms.</sub>
</div>
