'use strict';

// Masque l'interface de téléchargement de Chrome (bulle / barre) pour que les
// sauvegardes JSON se fassent en silence.
// setUiOptions remplace setShelfEnabled (déprécié depuis Chrome 117).
function hideDownloadUi() {
  if (chrome.downloads.setUiOptions) {
    const p = chrome.downloads.setUiOptions({ enabled: false });
    if (p && p.catch) p.catch(() => {});
  } else if (chrome.downloads.setShelfEnabled) {
    try {
      chrome.downloads.setShelfEnabled(false);
    } catch (e) {
      /* API indisponible */
    }
  }
}

hideDownloadUi();
chrome.runtime.onStartup.addListener(hideDownloadUi);
chrome.runtime.onInstalled.addListener(hideDownloadUi);

// Sauvegarde le JSON capturé : chrome.storage.local + fichier dans Downloads.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.action === 'save') {
    saveJson(msg.id, msg.json)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // réponse asynchrone
  }
});

async function saveJson(id, json) {
  hideDownloadUi();
  // 1. Stockage local (utilisé par l'historique du popup)
  await chrome.storage.local.set({ [id]: json });
  // 2. Fichier sur disque : ~/Downloads/cursor-inspector/<id>.json
  const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
  await chrome.downloads.download({
    url: url,
    filename: 'cursor-inspector/' + id + '.json',
    saveAs: false,
    conflictAction: 'uniquify',
  });
}