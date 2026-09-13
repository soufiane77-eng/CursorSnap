# Cursor Inspector

![Capture 1](p1.png)

![Capture 2](p2.png)

Chrome extension that detects the exact element under the cursor, captures its position and the cursor's position, and copies this data as JSON in one click.

## Benefits for AI agents

The copied JSON is designed to be given directly to an AI assistant:

- **Unique and verified CSS selector**: the agent targets the exact element without guessing, even with duplicated or nested elements
- **Precise position**: `cursor` (cursor position) and `element` (top, left, width, height) give the agent the complete spatial context

<span style="color:red; font-weight:800;">Example of a dialogue with an AI agent:</span>

> **User**: `{ "selector": "body > div:nth-of-type(1) > button:nth-of-type(2)", "cursor": { "x": 214, "y": 219 }, "element": { "top": 192, "left": 155, "width": 85, "height": 35 } }` place this element to the right
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
  "selector": "body > div:nth-of-type(1) > button:nth-of-type(2)",
  "cursor": { "x": 214, "y": 219 },
  "element": { "top": 192, "left": 155, "width": 85, "height": 35 }
}
```

7. Press **Esc** to stop the extension, **Esc** again to restart it



## Project structure

```
cursor-inspector-extension/
├── manifest.json   → Manifest V3, content_scripts on all pages
├── content.js      → detection logic, highlighting, JSON copy
├── styles.css      → styles for the highlight, the toast and the badge
├── popup.html      → popup interface (Start button)
├── popup.js        → sends the Start message to the content script
├── test.html       → simple test page
└── coiffeur.html   → complete test page
```

## Notes

- No build, no dependency, Vanilla JavaScript
- The copied JSON can be given to an AI assistant to move an element (e.g.: "move this element to this position")