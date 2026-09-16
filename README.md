# Cursor Inspector

![Capture 1](p1.png)

![Capture 2](p2.png)

Chrome extension that detects the exact element under the cursor, captures its position and the cursor's position, and copies this data as JSON in one click.

## Benefits for AI agents

The copied JSON is designed to be given directly to an AI assistant. It contains **4 independent signals** so the AI can identify the element exactly, even on dynamic pages, in shadow DOM, or inside iframes:

- **`selectors`**: unique and verified CSS selector (short + full path) and absolute XPath, with a confidence score
- **`element`**: rich fingerprint — tag, id, classes, all attributes, text content, ARIA role, form fields
- **`dom`**: DOM context — depth, index among siblings, ancestor chain, shadow DOM path, iframe path
- **`visual`**: visual signature — bounding rect, computed styles (display, position, colors, font), cursor position

If one signal fails (e.g. a selector breaks on a dynamic page), the AI can cross-check with the others.

<span style="color:red; font-weight:800;">Example of a dialogue with an AI agent:</span>

> **User**: `{ "selector": "body > div:nth-of-type(1) > button:nth-of-type(2)", "cursor": { "x": 214, "y": 219 }, "element": { "top": 192, "left": 155, "width": 85, "height": 35 } }` <span style="color:red; font-weight:800;">place this element to the right</span>
>
> **AI agent**: `document.querySelector('body > div:nth-of-type(1) > button:nth-of-type(2)').style.marginLeft = '200px';`

## Test pages

- `test.html`: simple page with nested elements (buttons, cards, duplicated elements)

## Features

- **Hover**: the element under the cursor is outlined in red
- **Click**: the JSON is automatically copied to the clipboard (unique CSS selector + cursor and element positions), with a confirmation toast
- **Esc**: stops or restarts the extension
- **Popup**: green Start button to start detection

## Installation

1. Open Chrome and go to `chrome://extensions`
2. Enable **developer mode** (top right corner)
3. Click **Load unpacked**
4. Select the `cursor-inspector-extension` folder
5. The "Cursor Inspector" extension appears

## Usage

1. Open a page (e.g.: `test.html` or `coiffeur.html`)
2. Click on the extension icon in the toolbar
3. Click the green **Start** button
4. Hover over elements: the red outline follows the cursor
5. Click on an element: the JSON is copied, a green "JSON copied!" toast appears
6. Paste the JSON into an editor:

```json
{
  "selectors": {
    "css": "body > div.card:nth-of-type(1) > button.btn:nth-of-type(2)",
    "cssShort": "#btn-submit",
    "xpath": "/html/body/div[1]/button[2]",
    "unique": true,
    "confidence": 0.95
  },
  "element": {
    "tag": "button",
    "id": "btn-submit",
    "classes": ["btn"],
    "attributes": { "type": "submit", "name": "submit", "data-action": "save" },
    "text": "Enregistrer",
    "role": "button",
    "ariaLabel": "Enregistrer les modifications",
    "name": "submit",
    "href": null, "src": null, "placeholder": null,
    "value": null, "alt": null, "title": null
  },
  "dom": {
    "depth": 4,
    "index": 1,
    "siblings": 3,
    "ancestors": [
      { "tag": "body", "id": null, "classes": [] },
      { "tag": "div", "id": null, "classes": ["card"] },
      { "tag": "form", "id": null, "classes": [] }
    ],
    "shadow": { "inShadowRoot": false, "hostSelector": null },
    "frame": { "isTop": true, "selector": null }
  },
  "visual": {
    "rect": { "top": 192, "left": 155, "width": 85, "height": 35 },
    "display": "inline-block", "visibility": "visible", "position": "static",
    "zIndex": "auto", "color": "rgb(255,255,255)",
    "backgroundColor": "rgb(46,204,113)", "fontSize": "14px",
    "fontFamily": "Arial, sans-serif",
    "cursor": { "x": 214, "y": 219 }
  }
}
```

7. Press **Esc** to stop the extension, **Esc** again to restart it



## Project structure

```
cursor-inspector-extension/
├── manifest.json      → Manifest V3, content_scripts on all pages + iframes
├── inspector-core.js  → pure functions: selectors, fingerprint, DOM context, visual signature
├── content.js         → event wiring, highlighting, JSON copy
├── styles.css         → styles for the highlight, the toast and the badge
├── popup.html         → popup interface (Start button)
├── popup.js           → sends the Start message to the content script
├── test.html          → test page (shadow DOM, iframe, duplicates, rich attributes)
├── test/              → Node tests (jsdom)
└── package.json       → npm test (jsdom devDependency)
```

## Notes

- No build, no runtime dependency, Vanilla JavaScript (jsdom is only a devDependency for tests)
- Run tests: `npm install` then `npm test`
- The copied JSON can be given to an AI assistant to move an element (e.g.: "move this element to this position")