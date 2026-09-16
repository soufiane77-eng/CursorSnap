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