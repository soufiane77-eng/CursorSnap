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