(() => {
  'use strict';

  // ===== État =====
  let highlightEl = null;
  let stopped = false;

  // ===== Génération du sélecteur CSS unique =====
  function getUniqueSelector(el) {
    if (el === document.body) return 'body';
    if (el === document.documentElement) return 'html';

    // 1. Un id unique suffit
    if (el.id) {
      const sel = '#' + CSS.escape(el.id);
      if (document.querySelectorAll(sel).length === 1) return sel;
    }

    // 2. Chemin complet avec nth-of-type pour garantir l'unicité
    const parts = [];
    let node = el;
    while (node && node !== document.documentElement) {
      if (node === document.body) {
        parts.unshift('body');
        break;
      }
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part = '#' + CSS.escape(node.id);
        parts.unshift(part);
        break;
      }
      const parent = node.parentElement;
      if (parent) {
        const sameTag = Array.from(parent.children).filter((s) => s.tagName === node.tagName);
        const index = sameTag.indexOf(node) + 1;
        part += ':nth-of-type(' + index + ')';
      }
      parts.unshift(part);
      node = parent;
    }

    const selector = parts.join(' > ');
    if (document.querySelectorAll(selector).length === 1) return selector;
    return selector; // meilleur effort : le chemin complet reste utilisable
  }

  // ===== Construction des données =====
  function buildData(el, x, y) {
    const rect = el.getBoundingClientRect();
    return {
      selector: getUniqueSelector(el),
      cursor: { x: Math.round(x), y: Math.round(y) },
      element: {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    };
  }

  // ===== Surlignage =====
  function setHighlight(el) {
    clearHighlight();
    if (el) {
      el.classList.add('ci-highlight');
      highlightEl = el;
    }
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
      // Fallback pour les contextes où l'API clipboard est refusée
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
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    setHighlight(el);
  }

  function onClick(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
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
  // Démarre arrêté : la détection ne s'active qu'avec le bouton Start du popup
  stopped = true;
  document.addEventListener('keydown', onKeyDown);
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === 'start') start();
  });
})();