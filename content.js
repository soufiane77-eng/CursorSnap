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
    // Un document ne peut pas recevoir d'appendChild direct : on cible <head>.
    const target = root === document ? document.head || document.documentElement : root;
    if (!target) return;
    if (target.querySelector('style.ci-highlight-style')) return;
    const style = document.createElement('style');
    style.className = 'ci-highlight-style';
    style.textContent =
      '.ci-highlight { outline: 2px solid #ff4757 !important; outline-offset: -2px !important; }';
    target.appendChild(style);
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
    // Retirer la classe de surlignage AVANT de capturer : elle polluerait
    // l'empreinte et les sélecteurs (classes/attributs de l'élément).
    clearHighlight();
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