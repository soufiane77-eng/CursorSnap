# Cursor Inspector v2 — Identification précise de l'élément — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir le JSON copié par l'extension avec 4 signaux indépendants (sélecteurs vérifiés, empreinte de l'élément, contexte DOM, signature visuelle) pour qu'une IA identifie l'élément à 100 %, y compris dans le shadow DOM et les iframes.

**Architecture:** Les fonctions pures sont extraites dans `inspector-core.js` (module UMD : utilisable en navigateur via `window.CursorInspectorCore` et en Node pour les tests). `content.js` ne garde que le câblage des événements. Tests Node avec jsdom (aucune dépendance d'exécution, uniquement devDependency).

**Tech Stack:** Vanilla JavaScript, Manifest V3, Node.js ≥ 18 (test runner natif `node --test`), jsdom (devDependency).

**Spec:** `docs/superpowers/specs/2026-09-16-element-identification-v2-design.md`

---

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `inspector-core.js` (créer) | Fonctions pures : `getSelectors`, `getElementFingerprint`, `getDomContext`, `getVisualSignature`, `deepElementFromPoint`, `buildData`. Export UMD. |
| `content.js` (modifier) | Câblage événements, surlignage (document + shadow roots), toast, copie. Utilise le core. |
| `manifest.json` (modifier) | Ajoute `inspector-core.js`, `all_frames: true`, version 2.0.0. |
| `test/inspector-core.test.js` (créer) | Tests Node + jsdom des fonctions pures. |
| `package.json` (créer) | Script `npm test`, devDependency jsdom. |
| `test.html` (modifier) | Page de test enrichie : shadow DOM, iframe, doublons, attributs riches. |
| `README.md` (modifier) | Documente le nouveau format JSON. |

---

### Task 1: Infrastructure de test + squelette du core

**Files:**
- Create: `package.json`
- Create: `inspector-core.js`
- Create: `test/inspector-core.test.js`

- [ ] **Step 1: Créer `package.json`**

```json
{
  "name": "cursor-inspector-extension",
  "version": "2.0.0",
  "private": true,
  "description": "Détecte l'élément précis sous le curseur et copie ses données en JSON pour une IA.",
  "scripts": {
    "test": "node --test test/"
  },
  "devDependencies": {
    "jsdom": "^24.0.0"
  }
}
```

- [ ] **Step 2: Installer jsdom**

Run: `npm install`
Expected: `added N packages` (jsdom + dépendances), création de `package-lock.json` et `node_modules/`.

- [ ] **Step 3: Créer `inspector-core.js` (squelette UMD)**

```js
/* Cursor Inspector Core — fonctions pures d'identification d'éléments.
 * UMD : window.CursorInspectorCore (navigateur) / module.exports (Node). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CursorInspectorCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getSelectors() {}
  function getElementFingerprint() {}
  function getDomContext() {}
  function getVisualSignature() {}
  function deepElementFromPoint() {}
  function buildData() {}

  return {
    getSelectors: getSelectors,
    getElementFingerprint: getElementFingerprint,
    getDomContext: getDomContext,
    getVisualSignature: getVisualSignature,
    deepElementFromPoint: deepElementFromPoint,
    buildData: buildData,
  };
});
```

- [ ] **Step 4: Créer `test/inspector-core.test.js` (fixture + smoke test)**

```js
'use strict';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');

const FIXTURE = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div class="card">
    <h2>Carte 1</h2>
    <button class="btn" id="btn-submit" type="submit" name="submit" data-action="save">Enregistrer</button>
    <button class="btn" type="button">Annuler</button>
  </div>
  <div class="card">
    <h2>Carte 2</h2>
    <button class="btn" type="button">Bouton 3</button>
  </div>
  <div class="duplicate">Dupliqué 1</div>
  <div class="duplicate">Dupliqué 2</div>
  <div id="dup"><button>A</button></div>
  <div id="dup"><button>B</button></div>
</body>
</html>`;

let dom;
let core;

beforeEach(() => {
  dom = new JSDOM(FIXTURE, { runScripts: 'outside-only' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.CSS = dom.window.CSS;
  core = require('../inspector-core.js');
});

test('core: expose les 6 fonctions', () => {
  assert.strictEqual(typeof core.getSelectors, 'function');
  assert.strictEqual(typeof core.getElementFingerprint, 'function');
  assert.strictEqual(typeof core.getDomContext, 'function');
  assert.strictEqual(typeof core.getVisualSignature, 'function');
  assert.strictEqual(typeof core.deepElementFromPoint, 'function');
  assert.strictEqual(typeof core.buildData, 'function');
});
```

- [ ] **Step 5: Lancer les tests pour vérifier l'échec**

Run: `npm test`
Expected: FAIL — `AssertionError: expected 'undefined' to equal 'function'` (les fonctions du squelette ne sont pas encore implémentées).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json inspector-core.js test/inspector-core.test.js
git commit -m "test: infrastructure de test jsdom + squelette du core"
```

---

### Task 2: `getSelectors` — CSS court, CSS complet, XPath, unicité, confiance

**Files:**
- Modify: `inspector-core.js`
- Modify: `test/inspector-core.test.js`

- [ ] **Step 1: Ajouter les tests de `getSelectors`**

Ajouter à la fin de `test/inspector-core.test.js` :

```js
test('getSelectors: id unique → cssShort #id, confiance 1.0', () => {
  const el = document.getElementById('btn-submit');
  const s = core.getSelectors(el);
  assert.strictEqual(s.css, '#btn-submit');
  assert.strictEqual(s.cssShort, '#btn-submit');
  assert.strictEqual(s.xpath, '/html/body/div[1]/button[1]');
  assert.strictEqual(s.unique, true);
  assert.strictEqual(s.confidence, 1.0);
});

test('getSelectors: chemin complet avec classes pour un élément sans id', () => {
  const el = document.querySelectorAll('.card')[0].querySelectorAll('button')[1];
  const s = core.getSelectors(el);
  assert.strictEqual(s.css, 'body > div.card:nth-of-type(1) > button.btn:nth-of-type(2)');
  assert.strictEqual(s.cssShort, s.css);
  assert.strictEqual(s.xpath, '/html/body/div[1]/button[2]');
  assert.strictEqual(s.unique, true);
  assert.strictEqual(s.confidence, 0.8);
});

test('getSelectors: doublons résolus par nth-of-type', () => {
  const el = document.querySelectorAll('.duplicate')[0];
  const s = core.getSelectors(el);
  assert.strictEqual(s.css, 'body > div.duplicate:nth-of-type(3)');
  assert.strictEqual(s.unique, true);
  assert.strictEqual(s.confidence, 0.8);
});

test('getSelectors: id dupliqué → unique false, confiance 0.5', () => {
  const el = document.querySelectorAll('#dup')[0].querySelector('button');
  const s = core.getSelectors(el);
  assert.strictEqual(s.css, '#dup > button:nth-of-type(1)');
  assert.strictEqual(s.unique, false);
  assert.strictEqual(s.confidence, 0.5);
  assert.strictEqual(s.xpath, '/html/body/div[5]/button[1]');
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `npm test`
Expected: FAIL — les assertions échouent (`undefined` au lieu des valeurs attendues).

- [ ] **Step 3: Implémenter `getSelectors` dans `inspector-core.js`**

Remplacer le corps du module par :

```js
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CursorInspectorCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ===== Helpers =====

  function cssEscape(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }
    return String(value).replace(/[^a-zA-Z0-9_-]/g, function (c) {
      return '\\' + c;
    });
  }

  function countMatches(selector) {
    try {
      return document.querySelectorAll(selector).length;
    } catch (e) {
      return -1; // sélecteur invalide
    }
  }

  // ===== Sélecteurs =====

  function buildPath(el, withClasses) {
    const parts = [];
    let node = el;
    while (node && node !== document.documentElement) {
      if (node === document.body) {
        parts.unshift('body');
        break;
      }
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part = '#' + cssEscape(node.id);
        parts.unshift(part);
        break;
      }
      if (withClasses) {
        const classes = Array.from(node.classList);
        if (classes.length) {
          part += classes.map(function (c) {
            return '.' + cssEscape(c);
          }).join('');
        }
      }
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter(function (s) {
          return s.tagName === node.tagName;
        });
        const index = sameTag.indexOf(node) + 1;
        part += ':nth-of-type(' + index + ')';
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  }

  function buildFullCssPath(el) {
    if (el === document.body) return 'body';
    if (el === document.documentElement) return 'html';
    const withClasses = buildPath(el, true);
    if (countMatches(withClasses) === 1) return withClasses;
    return buildPath(el, false);
  }

  function findShortestUniqueSelector(el) {
    const tag = el.tagName.toLowerCase();
    if (el.id) {
      const byId = '#' + cssEscape(el.id);
      if (countMatches(byId) === 1) return byId;
      const tagId = tag + byId;
      if (countMatches(tagId) === 1) return tagId;
    }
    const classes = Array.from(el.classList);
    if (classes.length) {
      const byClass = tag + classes.map(function (c) {
        return '.' + cssEscape(c);
      }).join('');
      if (countMatches(byClass) === 1) return byClass;
    }
    if (countMatches(tag) === 1) return tag;
    return buildFullCssPath(el);
  }

  function buildXPath(el) {
    if (el === document.documentElement) return '/html';
    if (el === document.body) return '/html/body';
    const parts = [];
    let node = el;
    while (node && node !== document.documentElement) {
      if (node === document.body) {
        parts.unshift('body');
        break;
      }
      let part = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter(function (s) {
          return s.tagName === node.tagName;
        });
        const index = sameTag.indexOf(node) + 1;
        part += '[' + index + ']';
      }
      parts.unshift(part);
      node = parent;
    }
    return '/html/' + parts.join('/');
  }

  function getSelectors(el) {
    const css = buildFullCssPath(el);
    const cssShort = findShortestUniqueSelector(el);
    const xpath = buildXPath(el);
    const cssUnique = countMatches(css) === 1;
    const shortUnique = countMatches(cssShort) === 1;
    const unique = cssUnique || shortUnique;
    let confidence = 0.5;
    if (el.id && countMatches('#' + cssEscape(el.id)) === 1) {
      confidence = 1.0;
    } else if (shortUnique && cssShort !== css) {
      confidence = 0.9;
    } else if (cssUnique) {
      confidence = 0.8;
    }
    return { css: css, cssShort: cssShort, xpath: xpath, unique: unique, confidence: confidence };
  }

  function getElementFingerprint() {}
  function getDomContext() {}
  function getVisualSignature() {}
  function deepElementFromPoint() {}
  function buildData() {}

  return {
    getSelectors: getSelectors,
    getElementFingerprint: getElementFingerprint,
    getDomContext: getDomContext,
    getVisualSignature: getVisualSignature,
    deepElementFromPoint: deepElementFromPoint,
    buildData: buildData,
  };
});
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `npm test`
Expected: PASS — les 5 tests passent (smoke test + 4 tests getSelectors).

- [ ] **Step 5: Commit**

```bash
git add inspector-core.js test/inspector-core.test.js
git commit -m "feat: sélecteurs CSS + XPath vérifiés avec score de confiance"
```

---

### Task 3: `getElementFingerprint` — empreinte riche de l'élément

**Files:**
- Modify: `inspector-core.js`
- Modify: `test/inspector-core.test.js`

- [ ] **Step 1: Ajouter les tests de `getElementFingerprint`**

```js
test('getElementFingerprint: attributs, texte, ARIA', () => {
  const el = document.getElementById('btn-submit');
  const f = core.getElementFingerprint(el);
  assert.strictEqual(f.tag, 'button');
  assert.strictEqual(f.id, 'btn-submit');
  assert.deepStrictEqual(f.classes, ['btn']);
  assert.strictEqual(f.attributes.type, 'submit');
  assert.strictEqual(f.attributes['data-action'], 'save');
  assert.strictEqual(f.text, 'Enregistrer');
  assert.strictEqual(f.role, null);
  assert.strictEqual(f.name, 'submit');
  assert.strictEqual(f.href, null);
  assert.strictEqual(f.src, null);
  assert.strictEqual(f.placeholder, null);
  assert.strictEqual(f.value, null);
  assert.strictEqual(f.alt, null);
  assert.strictEqual(f.title, null);
});

test('getElementFingerprint: texte nettoyé et tronqué à 200 caractères', () => {
  const el = document.createElement('div');
  el.textContent = '  a   b   c  ';
  document.body.appendChild(el);
  const f = core.getElementFingerprint(el);
  assert.strictEqual(f.text, 'a b c');

  const long = document.createElement('div');
  long.textContent = 'x'.repeat(300);
  document.body.appendChild(long);
  const f2 = core.getElementFingerprint(long);
  assert.strictEqual(f2.text.length, 201); // 200 + '…'
  assert.ok(f2.text.endsWith('…'));
});

test('getElementFingerprint: valeur des champs de formulaire (hors mot de passe)', () => {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = 'hello';
  document.body.appendChild(input);
  const f = core.getElementFingerprint(input);
  assert.strictEqual(f.value, 'hello');

  const pwd = document.createElement('input');
  pwd.type = 'password';
  pwd.value = 'secret';
  document.body.appendChild(pwd);
  const f2 = core.getElementFingerprint(pwd);
  assert.strictEqual(f2.value, null);
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `npm test`
Expected: FAIL — `getElementFingerprint` renvoie `undefined`.

- [ ] **Step 3: Implémenter `getElementFingerprint`**

Remplacer `function getElementFingerprint() {}` par :

```js
  function cleanText(text) {
    if (!text) return '';
    const cleaned = text.replace(/\s+/g, ' ').trim();
    return cleaned.length > 200 ? cleaned.slice(0, 200) + '…' : cleaned;
  }

  function getElementFingerprint(el) {
    const attributes = {};
    for (const attr of el.attributes) {
      attributes[attr.name] = attr.value;
    }
    const isFormControl = /^(input|textarea|select)$/i.test(el.tagName);
    const isPassword = el.type === 'password';
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: Array.from(el.classList),
      attributes: attributes,
      text: cleanText(el.textContent),
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'),
      name: el.getAttribute('name'),
      href: el.getAttribute('href'),
      src: el.getAttribute('src'),
      placeholder: el.getAttribute('placeholder'),
      value: isFormControl && !isPassword ? (el.value ?? null) : null,
      alt: el.getAttribute('alt'),
      title: el.getAttribute('title'),
    };
  }
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `npm test`
Expected: PASS — tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add inspector-core.js test/inspector-core.test.js
git commit -m "feat: empreinte riche de l'élément (attributs, texte, ARIA)"
```

---

### Task 4: `getDomContext` — profondeur, index, ancêtres, shadow DOM, frame

**Files:**
- Modify: `inspector-core.js`
- Modify: `test/inspector-core.test.js`

- [ ] **Step 1: Ajouter les tests de `getDomContext`**

```js
test('getDomContext: profondeur, index, ancêtres', () => {
  const el = document.getElementById('btn-submit');
  const d = core.getDomContext(el);
  assert.strictEqual(d.depth, 3);
  assert.strictEqual(d.index, 0);
  assert.strictEqual(d.siblings, 2);
  assert.deepStrictEqual(d.ancestors, [
    { tag: 'body', id: null, classes: [] },
    { tag: 'div', id: null, classes: ['card'] },
  ]);
  assert.strictEqual(d.shadow.inShadowRoot, false);
  assert.strictEqual(d.shadow.hostSelector, null);
  assert.strictEqual(d.frame.isTop, true);
  assert.strictEqual(d.frame.selector, null);
});

test('getDomContext: élément dans un shadow root', () => {
  const host = document.createElement('div');
  host.id = 'host';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const inner = document.createElement('button');
  inner.id = 'inner';
  shadow.appendChild(inner);

  const d = core.getDomContext(inner);
  assert.strictEqual(d.shadow.inShadowRoot, true);
  assert.strictEqual(d.shadow.hostSelector, '#host');
  assert.strictEqual(d.shadow.hosts.length, 1);
  assert.strictEqual(d.shadow.hosts[0].hostTag, 'div');
  assert.strictEqual(d.shadow.hosts[0].hostSelector, '#host');
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `npm test`
Expected: FAIL — `getDomContext` renvoie `undefined`.

- [ ] **Step 3: Implémenter `getDomContext`**

Remplacer `function getDomContext() {}` par :

```js
  function getShadowContext(el) {
    const ShadowRootCtor = typeof ShadowRoot !== 'undefined' ? ShadowRoot : null;
    const root = el.getRootNode();
    if (!ShadowRootCtor || !(root instanceof ShadowRootCtor)) {
      return { inShadowRoot: false, hostSelector: null };
    }
    const hosts = [];
    let node = el;
    while (node) {
      const r = node.getRootNode();
      if (r instanceof ShadowRootCtor) {
        hosts.unshift({
          hostSelector: getSelectors(r.host).css,
          hostTag: r.host.tagName.toLowerCase(),
        });
        node = r.host;
      } else {
        break;
      }
    }
    return {
      inShadowRoot: true,
      hostSelector: hosts.length ? hosts[0].hostSelector : null,
      hosts: hosts,
    };
  }

  function getFrameContext() {
    try {
      if (window === window.top) {
        return { isTop: true, selector: null };
      }
      const iframes = window.top.document.querySelectorAll('iframe, frame');
      for (const iframe of iframes) {
        if (iframe.contentWindow === window) {
          return { isTop: false, selector: getSelectors(iframe).css };
        }
      }
      return { isTop: false, selector: null };
    } catch (e) {
      return { isTop: false, selector: null };
    }
  }

  function getDomContext(el) {
    const chain = [];
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      chain.push({
        tag: node.tagName.toLowerCase(),
        id: node.id || null,
        classes: Array.from(node.classList),
      });
      node = node.parentElement;
    }
    const ancestors = chain.reverse();
    const parent = el.parentElement;
    const siblings = parent ? Array.from(parent.children) : [el];
    const index = siblings.indexOf(el);
    let depth = 0;
    node = el;
    while (node && node !== document.documentElement) {
      depth++;
      node = node.parentElement;
    }
    return {
      depth: depth,
      index: index,
      siblings: siblings.length,
      ancestors: ancestors,
      shadow: getShadowContext(el),
      frame: getFrameContext(),
    };
  }
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `npm test`
Expected: PASS — tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add inspector-core.js test/inspector-core.test.js
git commit -m "feat: contexte DOM (ancêtres, index, shadow DOM, frame)"
```

---

### Task 5: `getVisualSignature` — rect + styles calculés

**Files:**
- Modify: `inspector-core.js`
- Modify: `test/inspector-core.test.js`

- [ ] **Step 1: Ajouter les tests de `getVisualSignature`**

```js
test('getVisualSignature: rect, styles calculés, curseur', () => {
  const el = document.getElementById('btn-submit');
  const v = core.getVisualSignature(el, 100, 200);
  assert.deepStrictEqual(Object.keys(v.rect).sort(), ['height', 'left', 'top', 'width']);
  assert.strictEqual(typeof v.rect.top, 'number');
  assert.strictEqual(typeof v.rect.left, 'number');
  assert.strictEqual(typeof v.rect.width, 'number');
  assert.strictEqual(typeof v.rect.height, 'number');
  assert.strictEqual(v.position, 'static');
  assert.strictEqual(v.visibility, 'visible');
  assert.strictEqual(typeof v.display, 'string');
  assert.strictEqual(typeof v.color, 'string');
  assert.strictEqual(typeof v.backgroundColor, 'string');
  assert.strictEqual(typeof v.fontSize, 'string');
  assert.strictEqual(typeof v.fontFamily, 'string');
  assert.strictEqual(v.cursor.x, 100);
  assert.strictEqual(v.cursor.y, 200);
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `npm test`
Expected: FAIL — `getVisualSignature` renvoie `undefined`.

- [ ] **Step 3: Implémenter `getVisualSignature`**

Remplacer `function getVisualSignature() {}` par :

```js
  function getVisualSignature(el, x, y) {
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    return {
      rect: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      display: cs.display,
      visibility: cs.visibility,
      position: cs.position,
      zIndex: cs.zIndex,
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      cursor: { x: Math.round(x), y: Math.round(y) },
    };
  }
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `npm test`
Expected: PASS — tous les tests passent.

- [ ] **Step 5: Commit**

```bash
git add inspector-core.js test/inspector-core.test.js
git commit -m "feat: signature visuelle (rect + styles calculés)"
```

---

### Task 6: `deepElementFromPoint` + `buildData`

**Files:**
- Modify: `inspector-core.js`
- Modify: `test/inspector-core.test.js`

- [ ] **Step 1: Ajouter les tests**

```js
test('deepElementFromPoint: traverse les shadow roots', () => {
  const host = document.createElement('div');
  host.id = 'host';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const inner = document.createElement('button');
  inner.id = 'inner';
  shadow.appendChild(inner);

  const origDoc = document.elementFromPoint;
  document.elementFromPoint = () => host;
  shadow.elementFromPoint = () => inner;

  const result = core.deepElementFromPoint(10, 10);
  assert.strictEqual(result, inner);

  // Si le shadow root renvoie le host lui-même, on s'arrête
  shadow.elementFromPoint = () => host;
  const result2 = core.deepElementFromPoint(10, 10);
  assert.strictEqual(result2, host);

  document.elementFromPoint = origDoc;
});

test('buildData: structure complète avec les 4 signaux', () => {
  const el = document.getElementById('btn-submit');
  const data = core.buildData(el, 100, 200);
  assert.ok(data.selectors);
  assert.ok(data.element);
  assert.ok(data.dom);
  assert.ok(data.visual);
  assert.strictEqual(data.element.tag, 'button');
  assert.strictEqual(data.selectors.confidence, 1.0);
  assert.strictEqual(data.visual.cursor.x, 100);
});
```

- [ ] **Step 2: Lancer les tests pour vérifier l'échec**

Run: `npm test`
Expected: FAIL — `deepElementFromPoint` et `buildData` renvoient `undefined`.

- [ ] **Step 3: Implémenter `deepElementFromPoint` et `buildData`**

Remplacer `function deepElementFromPoint() {}` et `function buildData() {}` par :

```js
  function deepElementFromPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    while (el && el.shadowRoot) {
      const inner = el.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === el) break;
      el = inner;
    }
    return el;
  }

  function buildData(el, x, y) {
    return {
      selectors: getSelectors(el),
      element: getElementFingerprint(el),
      dom: getDomContext(el),
      visual: getVisualSignature(el, x, y),
    };
  }
```

- [ ] **Step 4: Lancer les tests pour vérifier le succès**

Run: `npm test`
Expected: PASS — tous les tests passent (12 tests au total).

- [ ] **Step 5: Commit**

```bash
git add inspector-core.js test/inspector-core.test.js
git commit -m "feat: deepElementFromPoint (shadow DOM) + buildData"
```

---

### Task 7: Câbler `content.js` + `manifest.json`

**Files:**
- Modify: `content.js`
- Modify: `manifest.json`

- [ ] **Step 1: Réécrire `content.js`**

Remplacer tout le contenu de `content.js` par :

```js
(() => {
  'use strict';

  const { buildData, deepElementFromPoint } = window.CursorInspectorCore;

  // Hook de debug : expose les fonctions pures (tests + usage IA)
  window.__cursorInspector = window.CursorInspectorCore;

  // ===== État =====
  let highlightEl = null;
  let stopped = false;

  // ===== Surlignage (document + shadow roots) =====
  function ensureHighlightStyle(root) {
    if (root.querySelector('style.ci-highlight-style')) return;
    const style = document.createElement('style');
    style.className = 'ci-highlight-style';
    style.textContent =
      '.ci-highlight { outline: 2px solid #ff4757 !important; outline-offset: -2px !important; }';
    root.appendChild(style);
  }

  function setHighlight(el) {
    clearHighlight();
    if (!el) return;
    ensureHighlightStyle(el.getRootNode());
    el.classList.add('ci-highlight');
    highlightEl = el;
  }

  function clearHighlight() {
    if (highlightEl) {
      highlightEl.classList.remove('ci-highlight');
      highlightEl = null;
    }
  }

  // ===== Copie presse-papiers =====
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e2) {
        ok = false;
      }
      ta.remove();
      return ok;
    }
  }

  // ===== Toast de confirmation =====
  function showToast(text, ok, x, y) {
    const old = document.querySelector('.ci-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'ci-toast' + (ok ? '' : ' err');
    toast.textContent = text;
    document.documentElement.appendChild(toast);

    const offset = 16;
    let left = x + offset;
    let top = y + offset;
    const rect = toast.getBoundingClientRect();
    if (left + rect.width > window.innerWidth - 8) {
      left = x - rect.width - offset;
    }
    if (top + rect.height > window.innerHeight - 8) {
      top = y - rect.height - offset;
    }
    toast.style.left = Math.max(8, left) + 'px';
    toast.style.top = Math.max(8, top) + 'px';

    setTimeout(() => toast.remove(), 1200);
  }

  // ===== Événements =====
  function onMouseMove(e) {
    const el = deepElementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    setHighlight(el);
  }

  function onClick(e) {
    const el = deepElementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    const data = buildData(el, e.clientX, e.clientY);
    const json = JSON.stringify(data, null, 2);
    setHighlight(el);
    copyText(json).then((ok) => {
      showToast(ok ? 'JSON copié !' : 'Erreur de copie', ok, e.clientX, e.clientY);
    });
  }

  function onKeyDown(e) {
    if (e.key !== 'Escape') return;
    if (stopped) {
      start();
    } else {
      stop();
    }
  }

  // ===== Arrêt / relance =====
  function stop() {
    stopped = true;
    clearHighlight();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onClick);

    const badge = document.createElement('div');
    badge.className = 'ci-stopped';
    badge.textContent = 'Cursor Inspector arrêté (Échap pour relancer)';
    document.documentElement.appendChild(badge);
  }

  function start() {
    if (!stopped) return;
    stopped = false;
    const badge = document.querySelector('.ci-stopped');
    if (badge) badge.remove();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
  }

  // ===== Initialisation =====
  stopped = true;
  document.addEventListener('keydown', onKeyDown);
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === 'start') start();
  });
})();
```

- [ ] **Step 2: Modifier `manifest.json`**

Remplacer tout le contenu par :

```json
{
  "manifest_version": 3,
  "name": "Cursor Inspector",
  "version": "2.0.0",
  "description": "Détecte l'élément précis sous le curseur et copie ses données (sélecteurs CSS + XPath, empreinte, contexte DOM) en JSON pour une IA.",
  "permissions": ["clipboardWrite", "activeTab"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Cursor Inspector"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["inspector-core.js", "content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle",
      "all_frames": true
    }
  ]
}
```

- [ ] **Step 3: Vérifier que les tests passent toujours**

Run: `npm test`
Expected: PASS — 12 tests.

- [ ] **Step 4: Vérification manuelle dans Chrome**

1. `chrome://extensions` → mode développeur → **Charger l'extension non empaquetée** → sélectionner le dossier
2. Ouvrir `test.html`
3. Cliquer sur l'icône de l'extension → **Start**
4. Survolez un élément : le contour rouge suit le curseur
5. Cliquez sur un élément : le JSON est copié, toast vert
6. Coller le JSON dans un éditeur : vérifier les 4 sections (`selectors`, `element`, `dom`, `visual`)

- [ ] **Step 5: Commit**

```bash
git add content.js manifest.json
git commit -m "feat: câblage content.js sur le core + support iframes (all_frames)"
```

---

### Task 8: Enrichir `test.html`

**Files:**
- Modify: `test.html`

- [ ] **Step 1: Remplacer `test.html`**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Page de test Cursor Inspector</title>
  <style>
    body { font-family: sans-serif; padding: 40px; }
    .card { border: 1px solid #ccc; padding: 16px; margin: 16px 0; }
    .card h2 { margin-top: 0; }
    button { padding: 8px 14px; }
    #unique-element { background: #ffeaa7; padding: 12px; }
    .duplicate { background: #dfe6e9; padding: 8px; margin: 4px 0; }
    .shadow-box { border: 2px dashed #6c5ce7; padding: 16px; margin: 16px 0; }
    iframe { border: 1px solid #ccc; width: 100%; height: 80px; margin: 16px 0; }
    label { display: block; margin: 8px 0; }
  </style>
</head>
<body>
  <h1>Page de test Cursor Inspector</h1>

  <div class="card">
    <h2>Carte 1</h2>
    <button class="btn" id="btn-submit" type="submit" name="submit" data-action="save" aria-label="Enregistrer les modifications">Enregistrer</button>
    <button class="btn" type="button">Annuler</button>
  </div>

  <div class="card">
    <h2>Carte 2</h2>
    <button class="btn" type="button">Bouton 3</button>
  </div>

  <div id="unique-element">Élément avec id unique</div>

  <div class="duplicate">Dupliqué 1</div>
  <div class="duplicate">Dupliqué 2</div>

  <h2>Attributs riches</h2>
  <label>Email : <input type="text" name="email" placeholder="Votre email" aria-label="Adresse email" data-field="contact"></label>
  <label>Mot de passe : <input type="password" name="password"></label>
  <a href="https://example.com" title="Exemple" target="_blank">Lien exemple</a>

  <h2>Shadow DOM</h2>
  <div class="shadow-box" id="shadow-host"></div>

  <h2>Iframe</h2>
  <iframe srcdoc="<button id='frame-btn' style='padding:8px 14px;'>Bouton dans l'iframe</button><p>Contenu de l'iframe</p>"></iframe>

  <script>
    const host = document.getElementById('shadow-host');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<button id="shadow-btn">Bouton shadow</button><p>Contenu du shadow root</p>';
  </script>
</body>
</html>
```

- [ ] **Step 2: Vérification manuelle dans Chrome**

1. Recharger l'extension (`chrome://extensions` → bouton recharger)
2. Ouvrir `test.html` → Start
3. Cliquer sur le bouton **shadow** : le JSON doit contenir `dom.shadow.inShadowRoot: true` et `hostSelector: "#shadow-host"`
4. Cliquer sur le bouton **dans l'iframe** : le JSON doit contenir `dom.frame.isTop: false`
5. Cliquer sur l'**input email** : le JSON doit contenir `placeholder`, `ariaLabel`, `data-field`
6. Cliquer sur l'**input mot de passe** : `value` doit être `null`

- [ ] **Step 3: Commit**

```bash
git add test.html
git commit -m "test: page de test enrichie (shadow DOM, iframe, attributs riches)"
```

---

### Task 9: Mettre à jour `README.md`

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Remplacer la section « Benefits for AI agents » et l'exemple JSON**

Remplacer les lignes 9-20 (section « Benefits for AI agents ») par :

```markdown
## Benefits for AI agents

The copied JSON is designed to be given directly to an AI assistant. It contains **4 independent signals** so the AI can identify the element exactly, even on dynamic pages, in shadow DOM, or inside iframes:

- **`selectors`**: unique and verified CSS selector (short + full path) and absolute XPath, with a confidence score
- **`element`**: rich fingerprint — tag, id, classes, all attributes, text content, ARIA role, form fields
- **`dom`**: DOM context — depth, index among siblings, ancestor chain, shadow DOM path, iframe path
- **`visual`**: visual signature — bounding rect, computed styles (display, position, colors, font), cursor position

If one signal fails (e.g. a selector breaks on a dynamic page), the AI can cross-check with the others.
```

Remplacer l'exemple JSON des lignes 50-56 par :

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

Mettre à jour la section « Project structure » (lignes 64-73) pour ajouter `inspector-core.js` et `test/` :

```markdown
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

Mettre à jour la section « Notes » (ligne 77) :

```markdown
- No build, no runtime dependency, Vanilla JavaScript (jsdom is only a devDependency for tests)
- Run tests: `npm install` then `npm test`
- The copied JSON can be given to an AI assistant to move an element (e.g.: "move this element to this position")
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: documente le nouveau format JSON v2"
```

---

### Task 10: Vérification finale

**Files:**
- None (vérification uniquement)

- [ ] **Step 1: Lancer tous les tests**

Run: `npm test`
Expected: PASS — 12 tests, 0 échec.

- [ ] **Step 2: Vérifier l'état git**

Run: `git status`
Expected: working tree clean (tout est commité).

- [ ] **Step 3: Vérification manuelle complète dans Chrome**

1. Recharger l'extension
2. Tester sur `test.html` : éléments normaux, shadow DOM, iframe, inputs
3. Tester sur un site réel (ex: une page avec des formulaires)
4. Vérifier que le JSON copié contient bien les 4 sections et que `window.__cursorInspector` est accessible dans la console

---

## Auto-revue du plan

**Couverture de la spec :**
- ✅ Multi-sélecteurs vérifiés (CSS court, CSS complet, XPath, unicité, confiance) → Task 2
- ✅ Empreinte riche (attributs, texte tronqué 200 car., ARIA, champs de formulaire) → Task 3
- ✅ Contexte DOM (profondeur, index, ancêtres, shadow DOM, frame) → Task 4
- ✅ Signature visuelle (rect + styles calculés) → Task 5
- ✅ deepElementFromPoint (shadow roots) → Task 6
- ✅ buildData (assemblage des 4 signaux) → Task 6
- ✅ manifest.json `all_frames: true` → Task 7
- ✅ test.html enrichi → Task 8
- ✅ README.md documenté → Task 9
- ✅ Hook `window.__cursorInspector` → Task 7
- ✅ Gestion des erreurs (unique false, confiance réduite, texte tronqué) → Tasks 2-3

**Pas de placeholders :** chaque étape contient le code complet.

**Cohérence des types :** `getSelectors` renvoie `{css, cssShort, xpath, unique, confidence}` partout ; `getShadowContext` renvoie `{inShadowRoot, hostSelector, hosts}` ; `getFrameContext` renvoie `{isTop, selector}` — cohérents entre les tasks 2, 4 et 6.