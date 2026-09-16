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