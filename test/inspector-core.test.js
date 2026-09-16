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